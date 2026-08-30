/**
 * Studio media + knowledge (INT-11, decisions.md D-INT-A/D/H).
 *
 * THE CATALOG IS THE GALLERY. E1 lists what this app was actually granted, and
 * every card's name, price, plan and params form come from the wire — no model
 * table is hardcoded here, and no vendor name exists to hardcode. A capability
 * that is unknown OR not granted answers 404 identically, on purpose, so
 * "granted" is something to probe rather than assume.
 *
 * TWO POLL VOCABULARIES, never shared: a media job reaches `succeeded`, a run
 * reaches `completed`. Sharing one predicate would poll one of them forever.
 *
 * UPLOADS are the single exception to the proxy law (D-INT-A): our API mints a
 * presigned PUT and the bytes go straight to storage, because the platform
 * deliberately never proxies bytes. `uploadToPresignedUrl` is the only caller.
 */
import { api } from '@/api/client'
import { isLiveMode } from '@/api/config'
import { isApiError } from '@/api/errors'
import { uploadToPresignedUrl } from '@/api/upload'
import type {
  ApiCapabilityCatalog,
  ApiMediaJob,
  ApiMediaJobList,
  ApiPlan,
  ApiRagCollection,
  ApiRagCollectionList,
  ApiRagSource,
  ApiRagSourceList,
  MediaDownloadTicket,
  MediaJobFanOutReceipt,
  MediaJobRequest,
  MediaUploadTicket,
  RagDeleteReceipt,
  RagSourceRequest,
  RagUploadTicket,
  SocialPostMediaTone,
  SocialPostsMediaRequest,
} from '@/api/types'
import { joinRules } from '@/data/adapters/brand-adapter'
import type { AuthActionResult } from '@/data/auth'
import { useLiveWorkingOrgId } from '@/data/provider'
import type { KnowledgeUploadKind, Tone } from '@/data/types'

export type {
  ApiCapabilityCatalog as CapabilityCatalog,
  ApiCatalogModel as CatalogModel,
  ApiMediaJob as MediaJob,
  ApiMediaAsset as MediaAsset,
  ApiRagCollection as KnowledgeCollection,
  ApiRagSource as KnowledgeSource,
  ApiPlan as MediaPlan,
} from '@/api/types'

/**
 * The capabilities E1 offers a COMPOSER for — the ones whose body shape is
 * fully known from `capabilitySchema` plus the upstream collection. Everything
 * else the catalog grants is listed honestly as coming soon rather than given
 * a form built on a guessed body (the founder's amendment 6, 2026-08-17).
 */
export const COMPOSABLE_CAPABILITIES = [
  'media.generate',
  'social-posts.media',
  'images.edit',
] as const

/** Every capability E1 probes. Granted-ness is discovered, never assumed. */
export const GALLERY_CAPABILITIES = [
  'media.generate',
  'images.edit',
  'social-posts.media',
  'photoshoot.generate',
  'brand-assets.generate',
  'logos.generate',
  'logos.redesign',
  'video-ads.generate',
] as const

/** The one collection this app keeps, created lazily on first use. */
export const KNOWLEDGE_COLLECTION = 'knowledge'
/** Proven by the smoke run: the alias this app holds. */
export const EMBEDDING_MODEL = 'embed-default'

/** Media types the platform proved it can extract (smoke run, all accepted). */
export const EXTRACTABLE_MEDIA_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

/**
 * The Knowledge upload's type choice (ORDER HSN-04): what a user may say they
 * are uploading, and the REAL media types each choice accepts. The picker's
 * `accept` list and the post-pick check both read this one table, so they
 * cannot disagree. `document` is exactly the extractable set the smoke run
 * proved; image and video are the founder's ruling — whether the RAG door
 * ingests them is the final gate's to observe, not this table's to assume.
 */
export const KNOWLEDGE_UPLOAD_KINDS: {
  kind: KnowledgeUploadKind
  label: string
  hint: string
  mediaTypes: readonly string[]
}[] = [
  {
    kind: 'image',
    label: 'Image',
    hint: 'PNG, JPG or WebP.',
    mediaTypes: ['image/png', 'image/jpeg', 'image/webp'],
  },
  { kind: 'video', label: 'Video', hint: 'MP4.', mediaTypes: ['video/mp4'] },
  {
    kind: 'document',
    label: 'Document',
    hint: 'PDF, Word, plain text or Markdown.',
    mediaTypes: EXTRACTABLE_MEDIA_TYPES,
  },
]

/**
 * The file's REAL type against the chosen kind. Honest in both failure modes:
 * a browser that reports no type at all is `unknown-type` (never coerced to
 * `text/plain`, as the old live path did), and a type outside the chosen
 * kind's list is `mismatch`. The media type that goes on the wire is the
 * file's own, verbatim.
 */
export function checkKnowledgeFile(
  kind: KnowledgeUploadKind,
  file: { name: string; type: string },
): { ok: true; mediaType: string } | { ok: false; reason: 'unknown-type' | 'mismatch' } {
  const spec = KNOWLEDGE_UPLOAD_KINDS.find((entry) => entry.kind === kind)
  if (!file.type) return { ok: false, reason: 'unknown-type' }
  if (!spec || !spec.mediaTypes.includes(file.type)) return { ok: false, reason: 'mismatch' }
  return { ok: true, mediaType: file.type }
}

/** A media job is terminal here — NOT a run. `succeeded`, not `completed`. */
export function isJobTerminal(job: ApiMediaJob | null | undefined): boolean {
  if (!job) return false
  return /^(succeeded|failed|cancell?ed)$/i.test(job.status)
}

// --- Create visual (HSN-02, decisions.md 2026-08-30) -------------------------

/**
 * The founder-approved style list. CLIENT-SIDE CURATION ONLY: `imgStyle` is
 * sent verbatim as a string and upstream accepts any string, so this list can
 * change without touching the contract. Cinematic is first because it is the
 * default.
 */
export const IMG_STYLES = [
  'Cinematic',
  'Photorealistic',
  'Minimalist',
  'Editorial',
  'Corporate',
  'Illustration',
  '3D Render',
  'Abstract',
] as const

/** Free-text guidance entries per request — founder-confirmed. */
export const MAX_VISUAL_GUIDANCE = 6

export type VisualKind = 'image' | 'video'

/** The user-editable half of the envelope. Everything else is derived. */
export interface PostVisualOptions {
  kind: VisualKind
  plan: ApiPlan
  imgStyle: string
  text: boolean
  logo: boolean
  guidance: string[]
}

/** The ONE post a request carries: the clicked draft, with its tone hydrated. */
export interface PostVisualSubject {
  ref: string
  content: string
  tone: Tone
}

/**
 * Our tone to the inline object a post carries. `rules` is `[]` when the
 * tone has none — never invented, and the key is never omitted.
 */
export function toVisualTone(tone: Tone): SocialPostMediaTone {
  return {
    id: tone.id,
    name: tone.name,
    description: tone.description,
    rules: joinRules(tone.rules),
  }
}

/**
 * The whole body, built in one place so the laws are structural rather than
 * a matter of care: exactly one post (the tuple type), `params` `{}`,
 * `collection.use` false, and guidance trimmed of blanks and capped at six.
 */
export function buildPostVisualRequest(
  subject: PostVisualSubject,
  options: PostVisualOptions,
): SocialPostsMediaRequest {
  return {
    capability: 'social-posts.media',
    plan: options.plan,
    kind: options.kind,
    posts: [{ ref: subject.ref, content: subject.content, tone: toVisualTone(subject.tone) }],
    style: { imgStyle: options.imgStyle, text: options.text, logo: options.logo },
    guidance: options.guidance
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, MAX_VISUAL_GUIDANCE),
    params: {},
    collection: { use: false },
  }
}

/**
 * The single job out of a fan-out receipt. The ruling says a LIST even for
 * one post, so the list is what is read. A bare job object is tolerated — the
 * single-job control call answered that shape (PROBE-INT13) — and anything
 * else is `null`: the request may have been accepted and billed, but there is
 * no job to follow, and the caller must say so rather than claim success.
 */
export function jobFromFanOutReceipt(receipt: unknown): ApiMediaJob | null {
  if (!receipt || typeof receipt !== 'object') return null
  const record = receipt as Partial<MediaJobFanOutReceipt> & Partial<ApiMediaJob>
  if (Array.isArray(record.jobs)) {
    const first: unknown = record.jobs[0]
    return first && typeof first === 'object' && typeof (first as ApiMediaJob).jobId === 'string'
      ? (first as ApiMediaJob)
      : null
  }
  return typeof record.jobId === 'string' ? (record as ApiMediaJob) : null
}

export type PostVisualResult =
  | { ok: true; job: ApiMediaJob }
  | {
      ok: false
      /** A 2xx with no job to follow — see `jobFromFanOutReceipt`. */
      code: 'unconfirmed_receipt'
      message: string
      requestId?: undefined
      retryAfterSeconds?: undefined
    }
  | Failure

type Failure = Extract<AuthActionResult, { ok: false }>

function toFailure(error: unknown): Failure {
  if (isApiError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldDetails,
      retryAfterSeconds: error.retryAfterSeconds,
    }
  }
  throw error
}

export function useStudioActions() {
  const orgId = useLiveWorkingOrgId()
  const live = isLiveMode()
  const studio = (path: string) => `/orgs/${orgId}/alphastudio${path}`

  return {
    orgId,

    /**
     * What one capability can run on. A 404 means unknown OR not granted — the
     * upstream answers both identically so the roadmap does not leak — so the
     * gallery treats null as "not ours" and simply does not list it.
     */
    async catalog(capability: string): Promise<ApiCapabilityCatalog | null> {
      if (!live || !orgId) return null
      try {
        return await api<ApiCapabilityCatalog>('GET', studio(`/catalog/capabilities/${capability}`))
      } catch {
        return null
      }
    },

    /** Queue a render. `modelAlias` is NEVER sent — it is refused by name. */
    async createJob(body: MediaJobRequest): Promise<{ ok: true; job: ApiMediaJob } | Failure> {
      try {
        const job = await api<ApiMediaJob>('POST', studio('/media/jobs'), { body })
        return { ok: true, job }
      } catch (error) {
        return toFailure(error)
      }
    },

    /**
     * Create visual (HSN-02): ONE post per call, and NEVER retried here. The
     * same route as `createJob`; only the body shape differs. The `posts[]`
     * path has been seen to create and bill a job and then answer 502
     * (PROBE-INT13), so a failure from this call is "unconfirmed", not
     * "nothing ran" — the caller says so, and only a fresh click sends
     * again. `requestId` travels with a failure so the report is actionable.
     */
    async createPostVisual(
      subject: PostVisualSubject,
      options: PostVisualOptions,
    ): Promise<PostVisualResult> {
      const body = buildPostVisualRequest(subject, options)
      try {
        const receipt = await api<unknown>('POST', studio('/media/jobs'), { body })
        const job = jobFromFanOutReceipt(receipt)
        if (!job) {
          return {
            ok: false,
            code: 'unconfirmed_receipt',
            message: 'The platform accepted the request but returned no job to follow.',
          }
        }
        return { ok: true, job }
      } catch (error) {
        if (isApiError(error)) return { ...toFailure(error), requestId: error.requestId }
        throw error
      }
    },

    async readJob(jobId: string): Promise<ApiMediaJob | null> {
      if (!live || !orgId) return null
      try {
        return await api<ApiMediaJob>('GET', studio(`/media/jobs/${jobId}`))
      } catch {
        return null
      }
    },

    /** Newest first, and deliberately WITHOUT presigned urls (E3). */
    async listJobs(): Promise<ApiMediaJob[]> {
      if (!live || !orgId) return []
      try {
        return (await api<ApiMediaJobList>('GET', studio('/media/jobs'))).jobs
      } catch {
        return []
      }
    },

    /** A fresh 1-hour GET url for one asset — minted only when opened (E4). */
    async assetUrl(assetId: string): Promise<string | null> {
      if (!live || !orgId) return null
      try {
        const ticket = await api<MediaDownloadTicket>(
          'POST',
          studio(`/media/assets/${assetId}/presign`),
        )
        return ticket.url
      } catch {
        return null
      }
    },

    async deleteAsset(assetId: string): Promise<AuthActionResult> {
      try {
        await api<void>('DELETE', studio(`/media/assets/${assetId}`))
        return { ok: true }
      } catch (error) {
        return toFailure(error)
      }
    },

    /**
     * A reference image, in. Two steps because the platform never proxies
     * bytes: our API mints the presign, the browser PUTs to storage
     * (D-INT-A), then a download presign yields the url a job body carries.
     */
    async uploadReferenceImage(
      file: Blob,
      mediaType: string,
    ): Promise<{ ok: true; url: string } | Failure> {
      try {
        const ticket = await api<MediaUploadTicket>('POST', studio('/media/assets/presign'), {
          body: { mediaType },
        })
        await uploadToPresignedUrl(ticket.uploadUrl, file, ticket.mediaType)
        const download = await api<MediaDownloadTicket>(
          'POST',
          studio(`/media/assets/${ticket.assetId}/presign`),
        )
        return { ok: true, url: download.url }
      } catch (error) {
        return toFailure(error)
      }
    },
  }
}

export function useKnowledgeActions() {
  const orgId = useLiveWorkingOrgId()
  const live = isLiveMode()
  const studio = (path: string) => `/orgs/${orgId}/alphastudio${path}`

  /**
   * The org's one collection, created LAZILY.
   *
   * A duplicate name is a 400, not a conflict code, so "create then fall back
   * to the list" is the whole algorithm — and it is exactly what the smoke run
   * proved works. `embeddingModel` is REQUIRED despite api.md marking it
   * optional (a body without it is a 400); a collection pins it for life.
   */
  async function ensureCollection(): Promise<string | null> {
    if (!live || !orgId) return null
    try {
      const created = await api<ApiRagCollection>('POST', studio('/rag/collections'), {
        body: {
          name: KNOWLEDGE_COLLECTION,
          scope: 'tenant',
          embeddingModel: EMBEDDING_MODEL,
        },
      })
      return created.collectionId
    } catch {
      try {
        const list = await api<ApiRagCollectionList>('GET', studio('/rag/collections'))
        return (
          list.collections.find((entry) => entry.name === KNOWLEDGE_COLLECTION)?.collectionId ??
          null
        )
      } catch {
        return null
      }
    }
  }

  return {
    orgId,
    ensureCollection,

    async listSources(collectionId: string): Promise<ApiRagSource[]> {
      if (!live || !orgId) return []
      try {
        return (
          await api<ApiRagSourceList>('GET', studio(`/rag/collections/${collectionId}/sources`))
        ).sources
      } catch {
        return []
      }
    },

    async readSource(sourceId: string): Promise<ApiRagSource | null> {
      if (!live || !orgId) return null
      try {
        return await api<ApiRagSource>('GET', studio(`/rag/sources/${sourceId}`))
      } catch {
        return null
      }
    },

    /** `push` (text we hold) or `url` (the platform fetches it). Answers 202. */
    async addSource(
      collectionId: string,
      body: RagSourceRequest,
    ): Promise<{ ok: true; source: ApiRagSource } | Failure> {
      try {
        const source = await api<ApiRagSource>(
          'POST',
          studio(`/rag/collections/${collectionId}/sources`),
          { body },
        )
        return { ok: true, source }
      } catch (error) {
        return toFailure(error)
      }
    },

    /**
     * A file, in. The row exists as `Uploading` the moment the presign is
     * issued; ingestion starts BY ITSELF when the object lands — there is no
     * "complete" call — and the presign expires in 15 minutes. The bytes must
     * carry exactly the requested media type: it is part of the signature.
     *
     * HSN-04: the presign body now carries `desc` — the user's own description
     * of the file — beside `mediaType`, per Hasan's 2026-08-28 envelope
     * (`Docs/api/alphastudio-shapes.md`, "Upstream presign envelope"). Sent
     * with NO switch, by the founder's word; the reasoning, and the fact that
     * this is the RAG door rather than open-item 43's media door, are in
     * decisions.md HSN-04. The key name is `desc`, exactly.
     */
    async uploadFile(
      collectionId: string,
      file: File,
      mediaType: string,
      desc: string,
    ): Promise<{ ok: true; source: ApiRagSource } | Failure> {
      try {
        const ticket = await api<RagUploadTicket>(
          'POST',
          studio(`/rag/collections/${collectionId}/sources/presign`),
          { body: { filename: file.name, mediaType, desc } },
        )
        await uploadToPresignedUrl(ticket.uploadUrl, file, ticket.mediaType)
        const source = await api<ApiRagSource>('GET', studio(`/rag/sources/${ticket.sourceId}`))
        return { ok: true, source }
      } catch (error) {
        return toFailure(error)
      }
    },

    /** 200 WITH a body here, not this API's usual 204 — the upstream shape. */
    async removeSource(sourceId: string): Promise<{ ok: true; vectorsDeleted: number } | Failure> {
      try {
        const receipt = await api<RagDeleteReceipt>('DELETE', studio(`/rag/sources/${sourceId}`))
        return { ok: true, vectorsDeleted: receipt.vectorsDeleted }
      } catch (error) {
        return toFailure(error)
      }
    },
  }
}
