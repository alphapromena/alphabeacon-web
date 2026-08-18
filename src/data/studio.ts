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
  ApiRagCollection,
  ApiRagCollectionList,
  ApiRagSource,
  ApiRagSourceList,
  MediaDownloadTicket,
  MediaJobRequest,
  MediaUploadTicket,
  RagDeleteReceipt,
  RagSourceRequest,
  RagUploadTicket,
} from '@/api/types'
import type { AuthActionResult } from '@/data/auth'
import { useLiveWorkingOrgId } from '@/data/provider'

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

/** A media job is terminal here — NOT a run. `succeeded`, not `completed`. */
export function isJobTerminal(job: ApiMediaJob | null | undefined): boolean {
  if (!job) return false
  return /^(succeeded|failed|cancell?ed)$/i.test(job.status)
}

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
     */
    async uploadFile(
      collectionId: string,
      file: File,
      mediaType: string,
    ): Promise<{ ok: true; source: ApiRagSource } | Failure> {
      try {
        const ticket = await api<RagUploadTicket>(
          'POST',
          studio(`/rag/collections/${collectionId}/sources/presign`),
          { body: { filename: file.name, mediaType } },
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
