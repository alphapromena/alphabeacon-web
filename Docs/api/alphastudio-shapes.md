# AlphaStudio proxy shapes — observed, not guessed

Captured by `pnpm tsx scripts/smoke-alphastudio.ts` against the deployed API.
The `/alphastudio/*` namespace forwards the external service's response shape
unchanged and the contract says new fields may appear without notice, so
`src/api/types.ts` is transcribed from THIS file rather than from prose
(decisions.md D-INT-H). Re-run the script when the upstream changes.

- Run: `2026-08-17T12:01:39.618Z`
- Identity: `qa+1786968099618smoke@alphapromena.com` (fresh QA org, starter funding only)
- Media render included: yes (LIVE_MEDIA=1)

Session tokens and presigned urls are redacted; every other field is verbatim.

## What this run established

- CORS: PUT IS allowed; the proxy POST path IS allowed; x-request-id is still NOT an allowed request header (open-items 3).
- Org response carries `country`: null on a fresh org.
- Starter funding observed: {"cents":5000,"heldCents":0,"availableCents":5000}
- Granted capabilities: media.generate, social-posts.media, images.edit, photoshoot.generate, brand-assets.generate, logos.generate, logos.redesign, video-ads.generate, tones.preview, social-posts.generate
- Not granted / unknown: (none)
- Catalog model-row fields observed: alias, appMetadata, capabilities, capabilitySchema, cost, displayHint, kind, plan — price exposed: YES.
- tones-preview on a fresh org (no voice): 200 — no voice was needed.
- Run output fields: attributions, content, flags, index, judge, proposalId; content keys: content, rationale, toneId
- `slot` on posts/generate: status 400 without it — treat as REQUIRED.
- `embeddingModel` on rag/collections: api.md marks it OPTIONAL, the upstream answers 400 without it — treat as REQUIRED (send `embed-default`).
- Duplicate collection name → 400; the list then resolves it (found) — the lazy-create-then-reuse path holds.
- RAG extractable media types — accepted: application/pdf, text/plain, text/markdown, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- RAG media types refused: (none)
- RAG presigned PUT from Node: 200 — storage accepts it.
- Media presigned PUT from Node: 200.
- Render produced 1 asset(s).
- Wallet: 5000 → 4997 cents (available 5000 → 4997). Spend this pass: 3 cents.

## Captured exchanges, in order

### CORS preflight — PUT /orgs/:orgId/country

`OPTIONS /orgs/1/country` → **200**
> preflight for PUT; method allowed: YES

```
access-control-allow-origin: http://localhost:5173
access-control-allow-methods: *
access-control-allow-headers: content-type,authorization
access-control-max-age: 3600
```

### CORS preflight — POST /orgs/:orgId/alphastudio/posts/generate

`OPTIONS /orgs/1/alphastudio/posts/generate` → **200**
> preflight for POST; method allowed: YES

```
access-control-allow-origin: http://localhost:5173
access-control-allow-methods: *
access-control-allow-headers: content-type,authorization
access-control-max-age: 3600
```

### signup

`POST /auth/signup` → **201**

```json
{
  "email": "qa+1786968099618smoke@alphapromena.com",
  "codeExpiresAt": "2026-08-17T12:11:42.998Z"
}
```

### verify-email → auth session

`POST /auth/verify-email` → **200**
> token redacted below — the shape is what matters

```json
{
  "token": "<redacted token: 43 chars>",
  "expiresAt": "2026-08-18T00:01:43.990Z",
  "user": {
    "id": "859",
    "name": "QA Smoke",
    "email": "qa+1786968099618smoke@alphapromena.com",
    "role": "user",
    "status": "active",
    "emailVerifiedAt": "2026-08-17T12:01:43.615Z",
    "createdAt": "2026-08-17T12:01:42.513Z"
  },
  "orgs": []
}
```

### create org (funds the wallet)

`POST /orgs` → **201**

```json
{
  "org": {
    "id": "570",
    "name": "QA Smoke Org 1786968099618",
    "slug": "qa-smoke-org-1786968099618",
    "status": "active",
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:01:44.578Z",
    "country": null
  },
  "membership": {
    "id": "713",
    "orgId": "570",
    "userId": "859",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:01:44.578Z"
  }
}
```

### wallet — fresh org

`GET /orgs/570/alphastudio/wallet` → **200**

```json
{
  "cents": 5000,
  "heldCents": 0,
  "availableCents": 5000
}
```

### catalog — media.generate

`GET /orgs/570/alphastudio/catalog/capabilities/media.generate` → **200**

```json
{
  "capability": "media.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Balanced image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.03"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Super image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.07"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced-audio",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video with audio (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.042"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-core-audio",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video with audio",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.052"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-super-audio",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video with audio (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.168"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — social-posts.media

`GET /orgs/570/alphastudio/catalog/capabilities/social-posts.media` → **200**

```json
{
  "capability": "social-posts.media",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Balanced image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.03"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Super image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.07"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced-audio",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video with audio (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.042"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-core-audio",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video with audio",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.052"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-super-audio",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video with audio (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.168"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — images.edit

`GET /orgs/570/alphastudio/catalog/capabilities/images.edit` → **200**

```json
{
  "capability": "images.edit",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — photoshoot.generate

`GET /orgs/570/alphastudio/catalog/capabilities/photoshoot.generate` → **200**

```json
{
  "capability": "photoshoot.generate",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — brand-assets.generate

`GET /orgs/570/alphastudio/catalog/capabilities/brand-assets.generate` → **200**

```json
{
  "capability": "brand-assets.generate",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-design",
      "kind": "image",
      "plan": null,
      "displayHint": "Design & lettered image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "brand-assets.generate"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — logos.generate

`GET /orgs/570/alphastudio/catalog/capabilities/logos.generate` → **200**

```json
{
  "capability": "logos.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Balanced image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.03"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Super image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — logos.redesign

`GET /orgs/570/alphastudio/catalog/capabilities/logos.redesign` → **200**

```json
{
  "capability": "logos.redesign",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — video-ads.generate

`GET /orgs/570/alphastudio/catalog/capabilities/video-ads.generate` → **200**

```json
{
  "capability": "video-ads.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.07"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced-audio",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video with audio (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.042"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-core-audio",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video with audio",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.052"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-super-audio",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video with audio (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.168"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — tones.preview

`GET /orgs/570/alphastudio/catalog/capabilities/tones.preview` → **200**

```json
{
  "capability": "tones.preview",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": []
}
```

### catalog — social-posts.generate

`GET /orgs/570/alphastudio/catalog/capabilities/social-posts.generate` → **200**

```json
{
  "capability": "social-posts.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "balanced",
      "kind": "text",
      "plan": "balanced",
      "displayHint": "Balanced",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "topP": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "maxTokens": {
            "type": "integer",
            "maximum": 8192,
            "minimum": 1
          },
          "temperature": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "stopSequences": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "maxItems": 4
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "social-posts.generate"
      ],
      "cost": {
        "input_tokens": "0.0000008",
        "output_tokens": "0.0000032"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "creative",
      "kind": "text",
      "plan": "creative",
      "displayHint": "Creative",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "topP": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "maxTokens": {
            "type": "integer",
            "maximum": 8192,
            "minimum": 1
          },
          "temperature": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "stopSequences": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "maxItems": 4
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "social-posts.generate"
      ],
      "cost": {
        "input_tokens": "0.0000008",
        "output_tokens": "0.0000032"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "precise",
      "kind": "text",
      "plan": "precise",
      "displayHint": "Precise",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "topP": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "maxTokens": {
            "type": "integer",
            "maximum": 8192,
            "minimum": 1
          },
          "temperature": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "stopSequences": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "maxItems": 4
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "social-posts.generate"
      ],
      "cost": {
        "input_tokens": "0.000003",
        "output_tokens": "0.000015"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### posts/tones-preview — no brandVoice (bundle fallback)

`POST /orgs/570/alphastudio/posts/tones-preview` → **200**
> brandVoice deliberately omitted — the fallback path is what real generation uses

```json
{
  "runId": "run_ac0c88dd7d3b850842843468",
  "capability": "tones.preview",
  "capabilityVersion": 2,
  "mode": "sync",
  "status": "completed",
  "outputs": [
    {
      "index": 0,
      "content": {
        "sample": "Our Ethiopia Yirgacheffe arrived yesterday—bright acidity, notes of blueberry, roasted last Tuesday."
      },
      "flags": [],
      "attributions": []
    }
  ],
  "modelVersions": [
    {
      "step": "sample",
      "alias": "small"
    }
  ],
  "promptVersions": [
    {
      "capability": "tones.preview",
      "name": "v2",
      "version": 2,
      "contentHash": "d37f555ad7efe39b6349e013321f1e97e8eb1c2b9be39b9497ef4259447695ae"
    }
  ],
  "createdAt": "2026-08-17T12:01:57.930Z",
  "updatedAt": "2026-08-17T12:01:59.627Z"
}
```

### brand/voices — create the canonical row

`POST /orgs/570/brand/voices` → **201**
> D-INT-B: one canonical voice row named "Brand voice"

```json
{
  "id": "52",
  "orgId": "570",
  "description": "QA Smoke Org 1786968099618 brand voice",
  "createdAt": "2026-08-17T12:02:00.319Z",
  "updatedAt": "2026-08-17T12:02:00.319Z",
  "name": "Brand voice",
  "rules": [
    {
      "id": "31",
      "kind": "do",
      "text": "Sound like a person who roasts coffee, not a brand."
    }
  ]
}
```

### brand/voices — read back (rules embedded)

`GET /orgs/570/brand/voices` → **200**

```json
{
  "items": [
    {
      "id": "52",
      "orgId": "570",
      "description": "QA Smoke Org 1786968099618 brand voice",
      "createdAt": "2026-08-17T12:02:00.319Z",
      "updatedAt": "2026-08-17T12:02:00.319Z",
      "name": "Brand voice",
      "rules": [
        {
          "id": "31",
          "kind": "do",
          "text": "Sound like a person who roasts coffee, not a brand."
        }
      ]
    }
  ],
  "total": 1
}
```

### posts/generate — plan balanced, one tone

`POST /orgs/570/alphastudio/posts/generate` → **202**
> HSN-01 (2026-08-30): `options.perTone` is removed from the generate body — upstream
> does not read it, and a probe without it (fresh QA org 1364, request
> `ce257b64-e5e1-4b3a-a00f-74144dc9388a`) answered 202. The capture below predates
> that removal; the target envelope is at the end of this file.

```json
{
  "runId": "run_3b3a9d410b7239670489804d",
  "capability": "social-posts.generate",
  "capabilityVersion": 4,
  "mode": "batch",
  "status": "queued",
  "outputs": [],
  "modelVersions": [],
  "promptVersions": [],
  "createdAt": "2026-08-17T12:02:06.101Z",
  "updatedAt": "2026-08-17T12:02:06.101Z"
}
```

### posts/runs/:runId — terminal read (completed)

`GET /orgs/570/alphastudio/posts/runs/run_3b3a9d410b7239670489804d` → **200**
> THE draft output shape — what INT-10 renders from

```json
{
  "runId": "run_3b3a9d410b7239670489804d",
  "capability": "social-posts.generate",
  "capabilityVersion": 4,
  "mode": "batch",
  "status": "completed",
  "outputs": [
    {
      "index": 0,
      "content": {
        "toneId": "smoke-tone",
        "content": "Today's roast comes from the highlands of Ethiopia, freshly ground and ready for your morning cup. Enjoy the rich aroma and deep flavors. #CoffeeLovers #DailyRoast",
        "rationale": "The post was crafted to fit the 'Roastery floor' tone, focusing on the specific origin of the coffee and the experience of the roast, in line with the brand's voice of sounding like a person who roasts coffee. No exclamation marks or hype adjectives were used, adhering to the tone's rules. Since there were no specific `<history>` blocks to avoid, no particular post was sidestepped. No `<knowledge>` or `<source>` blocks were provided, so no refs are included in the rationale."
      },
      "judge": {
        "score": 0.65,
        "voice": 0.75,
        "grounding": 0.5,
        "repetition": 0
      },
      "flags": [],
      "attributions": [],
      "proposalId": "prop_ced73568e10f0ecd45d4836c"
    }
  ],
  "modelVersions": [
    {
      "step": "write",
      "alias": "balanced"
    },
    {
      "step": "score",
      "alias": "judge"
    }
  ],
  "promptVersions": [
    {
      "capability": "social-posts.generate",
      "name": "v7",
      "version": 7,
      "contentHash": "734fa9461349ad483988a86689350b7ac3737466500c212b43a0424030d0e6fd"
    },
    {
      "capability": "social-posts.generate",
      "name": "rubric-v6",
      "version": 6,
      "contentHash": "97637001b22eeae55f3995f483e73994500c5306af201fe68c63030677ac59f1"
    }
  ],
  "createdAt": "2026-08-17T12:02:06.101Z",
  "updatedAt": "2026-08-17T12:02:16.762Z"
}
```

### posts/generate — WITHOUT slot (is it required?)

`POST /orgs/570/alphastudio/posts/generate` → **400**
> a 400 here means F1 must always send a slot; a 202 means it is optional

```json
{
  "error": {
    "code": "bad_request",
    "message": "The generation service rejected the request — check the body against the capability's schema",
    "requestId": "aec648e1-df24-4243-a2fb-60d5ee327728"
  }
}
```

### posts/runs/:runId — unknown id

`GET /orgs/570/alphastudio/posts/runs/run_smoke_missing` → **404**
> the ledger must drop an id that answers 404 (D-INT-G)

```json
{
  "error": {
    "code": "not_found",
    "message": "Run not found",
    "requestId": "95a99694-1287-449f-b836-2d000e45d571"
  }
}
```

### rag/collections — WITHOUT embeddingModel (api.md says optional)

`POST /orgs/570/alphastudio/rag/collections` → **400**
> expected to fail — see the finding

```json
{
  "error": {
    "code": "bad_request",
    "message": "The knowledge service rejected the request — check the body (e.g. a name already used, or a media type it cannot extract)",
    "requestId": "5149daab-0710-4f0a-a2c5-120c54d85af2"
  }
}
```

### rag/collections — create "knowledge" (scope tenant)

`POST /orgs/570/alphastudio/rag/collections` → **201**

```json
{
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "name": "knowledge",
  "scope": "tenant",
  "embeddingModel": "embed-default",
  "chunkProfile": "default-text",
  "activeIndex": "aps-alphabeacon-embed-default-v1",
  "status": "active",
  "createdAt": "2026-08-17T12:02:21.616Z",
  "updatedAt": "2026-08-17T12:02:21.616Z"
}
```

### rag/collections — the SAME name again (duplicate)

`POST /orgs/570/alphastudio/rag/collections` → **400**
> I6 creates lazily: on this 400 it lists and reuses

```json
{
  "error": {
    "code": "bad_request",
    "message": "The knowledge service rejected the request — check the body (e.g. a name already used, or a media type it cannot extract)",
    "requestId": "adfc1623-f001-4ae5-b053-9fd6730abd87"
  }
}
```

### rag/collections — list (the reuse path)

`GET /orgs/570/alphastudio/rag/collections` → **200**

```json
{
  "collections": [
    {
      "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
      "name": "knowledge",
      "scope": "tenant",
      "embeddingModel": "embed-default",
      "chunkProfile": "default-text",
      "activeIndex": "aps-alphabeacon-embed-default-v1",
      "status": "active",
      "createdAt": "2026-08-17T12:02:21.616Z",
      "updatedAt": "2026-08-17T12:02:21.616Z"
    }
  ]
}
```

### rag sources — push markdown

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources` → **202**

```json
{
  "sourceId": "src_1a762b11388b45c38b5719e58b1b2c11",
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "kind": "push",
  "title": "Roasting notes",
  "mediaType": "text/markdown",
  "status": "Processing",
  "chunkCount": 0,
  "deduped": false,
  "createdAt": "2026-08-17T12:02:24.004Z",
  "updatedAt": "2026-08-17T12:02:24.004Z"
}
```

### rag/sources/:sourceId — terminal read (Ready)

`GET /orgs/570/alphastudio/rag/sources/src_1a762b11388b45c38b5719e58b1b2c11` → **200**

```json
{
  "sourceId": "src_1a762b11388b45c38b5719e58b1b2c11",
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "kind": "push",
  "title": "Roasting notes",
  "mediaType": "text/markdown",
  "status": "Ready",
  "contentHash": "b1fc347f0aacd4876da63ad23af20abd1d2c0a540d099ba5f5e659d109beaee8",
  "chunkCount": 1,
  "deduped": false,
  "createdAt": "2026-08-17T12:02:24.004Z",
  "updatedAt": "2026-08-17T12:02:28.065Z"
}
```

### rag sources/presign — application/pdf

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_f8f19cdb6f1142f7bdeef313b274c959",
  "uploadUrl": "<redacted uploadUrl: 1613 chars>",
  "expiresAt": "2026-08-17T12:17:31.524Z",
  "mediaType": "application/pdf"
}
```

### rag sources/presign — text/plain

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_383522d8896048c8b1c021b9a467ebf0",
  "uploadUrl": "<redacted uploadUrl: 1613 chars>",
  "expiresAt": "2026-08-17T12:17:33.846Z",
  "mediaType": "text/plain"
}
```

### rag sources/presign — text/markdown

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_db378f0a88ae4ed2b4ffa70c26a0fcf2",
  "uploadUrl": "<redacted uploadUrl: 1612 chars>",
  "expiresAt": "2026-08-17T12:17:36.118Z",
  "mediaType": "text/markdown"
}
```

### rag sources/presign — application/vnd.openxmlformats-officedocument.wordprocessingml.document

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_49410188af294db2a5b19c2b6e52cee8",
  "uploadUrl": "<redacted uploadUrl: 1614 chars>",
  "expiresAt": "2026-08-17T12:17:38.513Z",
  "mediaType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
```

### PUT bytes to the RAG presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200**
> proves the signature works; the BROWSER path additionally needs S3 CORS

### rag/sources/:sourceId — terminal read (Ready)

`GET /orgs/570/alphastudio/rag/sources/src_383522d8896048c8b1c021b9a467ebf0` → **200**

```json
{
  "sourceId": "src_383522d8896048c8b1c021b9a467ebf0",
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "kind": "upload",
  "title": "smoke.txt",
  "mediaType": "text/plain",
  "status": "Ready",
  "contentHash": "1ec4b7136fb4dee3bf09e024fb9ae80d2c8fac3f164275fdbe0257baab7aa493",
  "chunkCount": 1,
  "deduped": false,
  "createdAt": "2026-08-17T12:02:33.828Z",
  "updatedAt": "2026-08-17T12:02:41.414Z"
}
```

### rag/sources/:id — DELETE (200 WITH a body)

`DELETE /orgs/570/alphastudio/rag/sources/src_1a762b11388b45c38b5719e58b1b2c11` → **200**

```json
{
  "sourceId": "src_1a762b11388b45c38b5719e58b1b2c11",
  "vectorsDeleted": 1
}
```

### rag/sources/:id — re-read after delete

`GET /orgs/570/alphastudio/rag/sources/src_1a762b11388b45c38b5719e58b1b2c11` → **404**
> expected 404

```json
{
  "error": {
    "code": "not_found",
    "message": "Source not found",
    "requestId": "31fc08f1-a524-4064-90c3-d9b524813b66"
  }
}
```

### media/assets/presign — image/png

`POST /orgs/570/alphastudio/media/assets/presign` → **201**

```json
{
  "assetId": "masset_4b73c1a2d8f58aadd95e5a96",
  "uploadUrl": "<redacted uploadUrl: 1604 chars>",
  "expiresAt": "2026-08-17T12:17:48.073Z",
  "mediaType": "image/png"
}
```

### PUT a 1×1 PNG to the media presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200**
> the reference-image door; the browser path additionally needs S3 CORS

### media/assets/:id/presign — download url

`POST /orgs/570/alphastudio/media/assets/masset_4b73c1a2d8f58aadd95e5a96/presign` → **200**

```json
{
  "assetId": "masset_4b73c1a2d8f58aadd95e5a96",
  "url": "<redacted url: 1564 chars>",
  "expiresAt": "2026-08-17T13:02:50.087Z"
}
```

### media/assets/:id — DELETE

`DELETE /orgs/570/alphastudio/media/assets/masset_4b73c1a2d8f58aadd95e5a96` → **204**
> expected 204

### media/jobs — list (empty or prior jobs, no presigned urls)

`GET /orgs/570/alphastudio/media/jobs` → **200**

```json
{
  "jobs": []
}
```

### media/jobs — media.generate, balanced, 1:1 png

`POST /orgs/570/alphastudio/media/jobs` → **202**
> never send modelAlias — it is refused by name

```json
{
  "jobId": "mjob_2cb5975ccd174177c3ab1d3b",
  "status": "queued",
  "capability": "media.generate",
  "plan": "balanced",
  "modelAlias": "image-balanced",
  "origin": {
    "kind": "standalone"
  },
  "assets": [],
  "createdAt": "2026-08-17T12:02:52.760Z",
  "updatedAt": "2026-08-17T12:02:52.760Z"
}
```

### media/jobs/:jobId — terminal read (succeeded)

`GET /orgs/570/alphastudio/media/jobs/mjob_2cb5975ccd174177c3ab1d3b` → **200**
> the render shape, assets with 1-hour presigned urls

```json
{
  "jobId": "mjob_2cb5975ccd174177c3ab1d3b",
  "status": "succeeded",
  "capability": "media.generate",
  "plan": "balanced",
  "modelAlias": "image-balanced",
  "origin": {
    "kind": "standalone"
  },
  "assets": [
    {
      "assetId": "masset_50db5663d865634ed52042be",
      "kind": "image",
      "url": "<redacted url: 1556 chars>",
      "expiresAt": "2026-08-17T13:03:12.591Z",
      "meta": {
        "width": 1024,
        "height": 1024,
        "synthetic": true
      }
    }
  ],
  "createdAt": "2026-08-17T12:02:52.760Z",
  "updatedAt": "2026-08-17T12:03:09.647Z"
}
```

### media/assets/:id — DELETE a render output

`DELETE /orgs/570/alphastudio/media/assets/masset_50db5663d865634ed52042be` → **204**

### usage — group_by=capability

`GET /orgs/570/alphastudio/usage?from=2026-07-19&to=2026-08-17&group_by=capability` → **200**

```json
{
  "from": "2026-07-19",
  "to": "2026-08-17",
  "groupBy": "capability",
  "groups": [
    {
      "key": "media.generate",
      "unit": "guardrail_text_units",
      "qty": 1,
      "costUsdEstimate": "0.000150000000"
    },
    {
      "key": "media.generate",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "key": "media.generate",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    },
    {
      "key": "social-posts.generate",
      "unit": "guardrail_text_units",
      "qty": 2,
      "costUsdEstimate": "0.000300000000"
    },
    {
      "key": "social-posts.generate",
      "unit": "input_tokens",
      "qty": 4241,
      "costUsdEstimate": "0.003803600000"
    },
    {
      "key": "social-posts.generate",
      "unit": "output_tokens",
      "qty": 622,
      "costUsdEstimate": "0.002827400000"
    },
    {
      "key": "tones.preview",
      "unit": "input_tokens",
      "qty": 677,
      "costUsdEstimate": "0.000677000000"
    },
    {
      "key": "tones.preview",
      "unit": "output_tokens",
      "qty": 29,
      "costUsdEstimate": "0.000145000000"
    }
  ],
  "days": [
    {
      "day": "2026-08-17",
      "unit": "guardrail_text_units",
      "qty": 3,
      "costUsdEstimate": "0.000450000000"
    },
    {
      "day": "2026-08-17",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "day": "2026-08-17",
      "unit": "input_tokens",
      "qty": 4918,
      "costUsdEstimate": "0.004480600000"
    },
    {
      "day": "2026-08-17",
      "unit": "output_tokens",
      "qty": 651,
      "costUsdEstimate": "0.002972400000"
    },
    {
      "day": "2026-08-17",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    }
  ]
}
```

### usage — group_by=model

`GET /orgs/570/alphastudio/usage?from=2026-07-19&to=2026-08-17&group_by=model` → **200**

```json
{
  "from": "2026-07-19",
  "to": "2026-08-17",
  "groupBy": "model",
  "groups": [
    {
      "key": null,
      "unit": "guardrail_text_units",
      "qty": 3,
      "costUsdEstimate": "0.000450000000"
    },
    {
      "key": "balanced",
      "unit": "input_tokens",
      "qty": 2187,
      "costUsdEstimate": "0.001749600000"
    },
    {
      "key": "balanced",
      "unit": "output_tokens",
      "qty": 157,
      "costUsdEstimate": "0.000502400000"
    },
    {
      "key": "embed-default",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    },
    {
      "key": "image-balanced",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "key": "judge",
      "unit": "input_tokens",
      "qty": 2054,
      "costUsdEstimate": "0.002054000000"
    },
    {
      "key": "judge",
      "unit": "output_tokens",
      "qty": 465,
      "costUsdEstimate": "0.002325000000"
    },
    {
      "key": "small",
      "unit": "input_tokens",
      "qty": 677,
      "costUsdEstimate": "0.000677000000"
    },
    {
      "key": "small",
      "unit": "output_tokens",
      "qty": 29,
      "costUsdEstimate": "0.000145000000"
    }
  ],
  "days": [
    {
      "day": "2026-08-17",
      "unit": "guardrail_text_units",
      "qty": 3,
      "costUsdEstimate": "0.000450000000"
    },
    {
      "day": "2026-08-17",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "day": "2026-08-17",
      "unit": "input_tokens",
      "qty": 4918,
      "costUsdEstimate": "0.004480600000"
    },
    {
      "day": "2026-08-17",
      "unit": "output_tokens",
      "qty": 651,
      "costUsdEstimate": "0.002972400000"
    },
    {
      "day": "2026-08-17",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    }
  ]
}
```

### usage — malformed window (expect 400)

`GET /orgs/570/alphastudio/usage?from=yesterday&to=2026-08-17&group_by=model` → **400**
> local validation, never reaches the upstream

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": [
      {
        "field": "from",
        "message": "Invalid ISO date"
      }
    ],
    "requestId": "5b734bec-d43a-4cd0-9009-f11b01483289"
  }
}
```

### wallet — after the run

`GET /orgs/570/alphastudio/wallet` → **200**

```json
{
  "cents": 4997,
  "heldCents": 0,
  "availableCents": 4997
}
```

### PUT /orgs/:id/country — JO (slow: loads the calendar)

`PUT /orgs/570/country` → **200**
> expect ~10 s

```json
{
  "org": {
    "id": "570",
    "name": "QA Smoke Org 1786968099618",
    "slug": "qa-smoke-org-1786968099618",
    "status": "active",
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:03:29.595Z",
    "country": "JO"
  },
  "holidaysCount": 2,
  "reloaded": true
}
```

### PUT /orgs/:id/country — same country again

`PUT /orgs/570/country` → **200**
> expect reloaded:false, a cheap no-op

```json
{
  "org": {
    "id": "570",
    "name": "QA Smoke Org 1786968099618",
    "slug": "qa-smoke-org-1786968099618",
    "status": "active",
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:03:29.595Z",
    "country": "JO"
  },
  "holidaysCount": 2,
  "reloaded": false
}
```

### GET /orgs/:id/holidays — calendar order

`GET /orgs/570/holidays?limit=3` → **200**

```json
{
  "items": [
    {
      "id": "12",
      "orgId": "570",
      "date": "2026-08-25",
      "event": "Prophet Muhammad's Birthday (Mawlid al-Nabi)",
      "rules": [
        {
          "kind": "do",
          "text": "Acknowledge the occasion with a respectful, warm message that honours the Prophet's legacy and its meaning for Muslim communities."
        },
        {
          "kind": "do",
          "text": "Use Arabic alongside English if your audience is primarily Jordanian — 'المولد النبوي' is the widely recognised term."
        },
        {
          "kind": "do",
          "text": "Keep the tone reverent and sincere; brief, heartfelt messages tend to land better than lengthy copy on this day."
        },
        {
          "kind": "dont",
          "text": "Do not use the occasion as a promotional hook or attach discount offers — commercial framing around a religious observance reads as disrespectful."
        },
        {
          "kind": "dont",
          "text": "Do not publish imagery of the Prophet or any figurative religious art; this is considered deeply offensive in Islamic tradition."
        },
        {
          "kind": "dont",
          "text": "Do not treat the date as a generic 'holiday' — it is a specifically Islamic religious commemoration and should be addressed as such."
        }
      ],
      "createdAt": "2026-08-17T12:03:29.595Z"
    },
    {
      "id": "13",
      "orgId": "570",
      "date": "2026-12-25",
      "event": "Christmas Day",
      "rules": [
        {
          "kind": "do",
          "text": "Acknowledge Christmas as a public holiday celebrated by Jordan's Christian community, while being mindful that the majority of your audience is Muslim."
        },
        {
          "kind": "do",
          "text": "Frame messaging inclusively — wishing Christian followers a joyful celebration is appropriate without making it a universal national moment."
        },
        {
          "kind": "do",
          "text": "Note that Orthodox Christians in Jordan may also celebrate Christmas on 7 January; consider a separate acknowledgement if your audience includes them."
        },
        {
          "kind": "dont",
          "text": "Do not assume the entire Jordanian audience celebrates Christmas — avoid blanket 'everyone is celebrating' framing."
        },
        {
          "kind": "dont",
          "text": "Do not lean into heavily commercialised Western Christmas imagery (Santa, gift-haul themes) without considering whether it fits your brand's local tone."
        }
      ],
      "createdAt": "2026-08-17T12:03:29.595Z"
    }
  ],
  "total": 2
}
```

## Proposals & published-social — NOT PROXIED (probed 2026-08-18) — SUPERSEDED

> **Superseded 2026-08-19**: proposals shipped (contract now 65 paths) and are
> captured in "Proposals — observed" below. This section is kept, not deleted,
> for two reasons: it is the honest record of what was true the day INT-11
> closed, and the probe METHOD in it is the reusable part — the
> auth-before-routing trap catches everyone once. `published-social` is still
> not proxied, so the negative below still holds for that half.

Probed because every draft a run produces comes back carrying a `proposalId`
(`prop_…`), so the proposals ledger demonstrably exists upstream — the question
was only whether our API exposes it. It does not, yet.

### 1. The live contract is unchanged

`GET {base}/openapi` was fetched and diffed against the committed
`Docs/api/openapi.json`:

```
live      version 0.1.0 · 62 paths
committed version 0.1.0 · 62 paths
added:   0
removed: 0
paths matching /proposal|published/: (none)
```

So the contract in this repo is current. Nothing has been added since the
2026-08-17 drop.

### 2. A route-level probe agrees, and here is how to read it

**The trap: an UNAUTHENTICATED probe proves nothing.** Auth runs before
routing, so every path — including deliberate nonsense like
`/orgs/1/alphastudio/posts/runs` — answers `401 unauthorized`. A first pass
that reads those 401s as "the route exists, it just needs a token" would
conclude the opposite of the truth. The probe must carry a real session and a
real org id, and it needs a known-good control and a known-bad control to be
worth anything.

Authenticated, on an org the caller owns:

| Status | code | Method | Path |
| ------ | ---- | ------ | ---- |
| **200** | — | GET | `/orgs/:id/alphastudio/wallet` — **control: exists** |
| **404** | `not_found` | GET | `/orgs/:id/alphastudio/nonexistent-xyz` — **control: does not** |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/proposals` |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/proposals?state=pending&limit=10` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/proposals/:id/approve` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/proposals/:id/decline` |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/published-social` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/published-social` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/published-social/delete` |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/posts/proposals` |
| 404 | `not_found` | GET | `/orgs/:id/proposals` (outside the proxy namespace) |

Every candidate answers exactly what a route that does not exist answers, and
nothing answers what a route that does exist answers.

### 3. What that means for the frontend

No generation run was made for this probe: with no list endpoint to call, a run
would have spent the org's funding to learn nothing. The relevant shape is
already captured above — `outputs[].proposalId`, e.g.
`prop_bf6fd4c695b9c20418ac5050`.

- INT-10's position stands: F1's drafts are read-only, and approve / decline /
  schedule remain ABSENT rather than disabled (decisions.md D-INT-G).
- The `proposalId` keeps being stored in the local run ledger and never
  rendered. It is the handle the day the surface is proxied, and storing it now
  costs nothing.
- open-items 21(b) stays OPEN, now with evidence rather than an assumption.

Re-run with `pnpm smoke:alphastudio` once the backend says the surface is up;
the diff in §1 is the cheap check that tells you whether it is worth probing.

## Proposals — observed (2026-08-19)

Captured by the INT-12 STEP 0 smoke against the deployed API: one fresh QA
org, one balanced run, then every decision transition the contract describes.
`src/api/types.ts`’s proposal half is transcribed from THIS (D-INT-H).

- Run: `2026-08-19T05:46:17.827Z`
- Identity: `qa+1787118377827p@alphapromena.com` (fresh QA org, starter funding only)

### What this run established

- tones-preview produces proposals: NO (list empty)
- Run outputs: 1; proposalId present on every output: true
- proposalIds from the run: ["prop_32fb5264f6e70df4c95f8f0b"]
- Proposals after ONE run: 1; states: ["pending"]
- nextCursor present on an unfiltered first page: false
- Re-approve with the same publishedId: 200 (safe retry)
- Approve with a different publishedId: 409
- publishedId after the 409: "mlk_prop_32fb5264f6e70df4c95f8f0b" (unchanged)
- Declining an approved proposal: 200; publishedId kept: "mlk_prop_32fb5264f6e70df4c95f8f0b"
- Only one proposal exists, so page 1 already ended (no nextCursor).

### Captured exchanges, in order

#### proposals AFTER a tones-preview only

`GET /orgs/611/alphastudio/proposals` → **200**
> expected empty: a preview is not a proposal

```json
{
  "proposals": []
}
```

#### posts/generate (balanced, 1 tone, perTone 1)

`POST /orgs/611/alphastudio/posts/generate` → **202**

```json
{
  "runId": "run_393115077bd9df42be68e747",
  "capability": "social-posts.generate",
  "capabilityVersion": 4,
  "mode": "batch",
  "status": "queued",
  "outputs": [],
  "modelVersions": [],
  "promptVersions": [],
  "createdAt": "2026-08-19T05:46:30.194Z",
  "updatedAt": "2026-08-19T05:46:30.194Z"
}
```

#### posts/runs/:runId - terminal read

`GET /orgs/611/alphastudio/posts/runs/run_393115077bd9df42be68e747` → **200**
> where proposalId sits on each output

```json
{
  "runId": "run_393115077bd9df42be68e747",
  "capability": "social-posts.generate",
  "capabilityVersion": 4,
  "mode": "batch",
  "status": "completed",
  "outputs": [
    {
      "index": 0,
      "content": {
        "toneId": "smoke-tone",
        "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
        "rationale": "This post aligns with the 'Roastery floor' tone by focusing on the sensory experience of the roast, mentioning the specific origin of the beans, and evoking the warm, inviting atmosphere of the roastery. It avoids repeating any previous posts and adheres to the tone's rules by naming the farm."
      },
      "judge": {
        "score": 0.4,
        "voice": 0.8,
        "grounding": 0,
        "repetition": 1
      },
      "flags": [],
      "attributions": [],
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b"
    }
  ],
  "modelVersions": [
    {
      "step": "write",
      "alias": "balanced"
    },
    {
      "step": "score",
      "alias": "judge"
    }
  ],
  "promptVersions": [
    {
      "capability": "social-posts.generate",
      "name": "v7",
      "version": 7,
      "contentHash": "734fa9461349ad483988a86689350b7ac3737466500c212b43a0424030d0e6fd"
    },
    {
      "capability": "social-posts.generate",
      "name": "rubric-v6",
      "version": 6,
      "contentHash": "97637001b22eeae55f3995f483e73994500c5306af201fe68c63030677ac59f1"
    }
  ],
  "createdAt": "2026-08-19T05:46:30.194Z",
  "updatedAt": "2026-08-19T05:46:38.985Z"
}
```

#### proposals - all

`GET /orgs/611/alphastudio/proposals` → **200**

```json
{
  "proposals": [
    {
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
      "runId": "run_393115077bd9df42be68e747",
      "outputIndex": 0,
      "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
      "key": "smoke-tone",
      "state": "pending",
      "reason": null,
      "publishedId": null,
      "createdAt": "2026-08-19T05:46:38.985Z",
      "decidedAt": null
    }
  ]
}
```

#### proposals - state=pending

`GET /orgs/611/alphastudio/proposals?state=pending` → **200**

```json
{
  "proposals": [
    {
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
      "runId": "run_393115077bd9df42be68e747",
      "outputIndex": 0,
      "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
      "key": "smoke-tone",
      "state": "pending",
      "reason": null,
      "publishedId": null,
      "createdAt": "2026-08-19T05:46:38.985Z",
      "decidedAt": null
    }
  ]
}
```

#### proposals - runId filter

`GET /orgs/611/alphastudio/proposals?runId=run_393115077bd9df42be68e747` → **200**

```json
{
  "proposals": [
    {
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
      "runId": "run_393115077bd9df42be68e747",
      "outputIndex": 0,
      "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
      "key": "smoke-tone",
      "state": "pending",
      "reason": null,
      "publishedId": null,
      "createdAt": "2026-08-19T05:46:38.985Z",
      "decidedAt": null
    }
  ]
}
```

#### decline WITH a reason

`POST /orgs/611/alphastudio/proposals/prop_32fb5264f6e70df4c95f8f0b/decline` → **200**
> the row stays - it is the no-repeat instruction

```json
{
  "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
  "runId": "run_393115077bd9df42be68e747",
  "outputIndex": 0,
  "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
  "key": "smoke-tone",
  "state": "declined",
  "reason": "Too promotional for a Tuesday.",
  "publishedId": null,
  "createdAt": "2026-08-19T05:46:38.985Z",
  "decidedAt": "2026-08-19T05:46:45.570Z"
}
```

#### approve with mlk_<proposalId>

`POST /orgs/611/alphastudio/proposals/prop_32fb5264f6e70df4c95f8f0b/approve` → **200**
> deterministic id, so a retry is safe by construction (D-INT-K)

```json
{
  "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
  "runId": "run_393115077bd9df42be68e747",
  "outputIndex": 0,
  "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
  "key": "smoke-tone",
  "state": "approved",
  "reason": "Too promotional for a Tuesday.",
  "publishedId": "mlk_prop_32fb5264f6e70df4c95f8f0b",
  "createdAt": "2026-08-19T05:46:38.985Z",
  "decidedAt": "2026-08-19T05:46:46.580Z"
}
```

#### approve AGAIN with the SAME id

`POST /orgs/611/alphastudio/proposals/prop_32fb5264f6e70df4c95f8f0b/approve` → **200**
> expected 200 - a safe retry

```json
{
  "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
  "runId": "run_393115077bd9df42be68e747",
  "outputIndex": 0,
  "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
  "key": "smoke-tone",
  "state": "approved",
  "reason": "Too promotional for a Tuesday.",
  "publishedId": "mlk_prop_32fb5264f6e70df4c95f8f0b",
  "createdAt": "2026-08-19T05:46:38.985Z",
  "decidedAt": "2026-08-19T05:46:46.580Z"
}
```

#### approve with a DIFFERENT id

`POST /orgs/611/alphastudio/proposals/prop_32fb5264f6e70df4c95f8f0b/approve` → **409**
> expected 409, nothing changes

```json
{
  "error": {
    "code": "conflict",
    "message": "The publishedId is already used, or this decision was already applied",
    "requestId": "4a6d737c-32cd-4d5c-a6d4-2cfa36becbe6"
  }
}
```

#### read back after the 409

`GET /orgs/611/alphastudio/proposals?runId=run_393115077bd9df42be68e747` → **200**
> proves the 409 changed nothing

```json
{
  "proposals": [
    {
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
      "runId": "run_393115077bd9df42be68e747",
      "outputIndex": 0,
      "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
      "key": "smoke-tone",
      "state": "approved",
      "reason": "Too promotional for a Tuesday.",
      "publishedId": "mlk_prop_32fb5264f6e70df4c95f8f0b",
      "createdAt": "2026-08-19T05:46:38.985Z",
      "decidedAt": "2026-08-19T05:46:46.580Z"
    }
  ]
}
```

#### decline the APPROVED one

`POST /orgs/611/alphastudio/proposals/prop_32fb5264f6e70df4c95f8f0b/decline` → **200**
> allowed - latest wins; the published entry is left alone

```json
{
  "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
  "runId": "run_393115077bd9df42be68e747",
  "outputIndex": 0,
  "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
  "key": "smoke-tone",
  "state": "declined",
  "reason": "Changed our mind after posting.",
  "publishedId": "mlk_prop_32fb5264f6e70df4c95f8f0b",
  "createdAt": "2026-08-19T05:46:38.985Z",
  "decidedAt": "2026-08-19T05:46:49.622Z"
}
```

#### proposals - state=declined

`GET /orgs/611/alphastudio/proposals?state=declined` → **200**

```json
{
  "proposals": [
    {
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
      "runId": "run_393115077bd9df42be68e747",
      "outputIndex": 0,
      "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
      "key": "smoke-tone",
      "state": "declined",
      "reason": "Changed our mind after posting.",
      "publishedId": "mlk_prop_32fb5264f6e70df4c95f8f0b",
      "createdAt": "2026-08-19T05:46:38.985Z",
      "decidedAt": "2026-08-19T05:46:49.622Z"
    }
  ]
}
```

#### proposals - state=approved

`GET /orgs/611/alphastudio/proposals?state=approved` → **200**

```json
{
  "proposals": []
}
```

#### cursor walk - limit=1, page 1

`GET /orgs/611/alphastudio/proposals?limit=1` → **200**

```json
{
  "proposals": [
    {
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
      "runId": "run_393115077bd9df42be68e747",
      "outputIndex": 0,
      "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
      "key": "smoke-tone",
      "state": "declined",
      "reason": "Changed our mind after posting.",
      "publishedId": "mlk_prop_32fb5264f6e70df4c95f8f0b",
      "createdAt": "2026-08-19T05:46:38.985Z",
      "decidedAt": "2026-08-19T05:46:49.622Z"
    }
  ]
}
```

#### proposals - unknown id decline

`POST /orgs/611/alphastudio/proposals/prop_missing/decline` → **404**
> expected 404

```json
{
  "error": {
    "code": "not_found",
    "message": "Proposal not found",
    "requestId": "0e24c21b-8996-4486-b9d1-b5cfe75a4e04"
  }
}
```

### Keyset paging, walked (follow-up run)

- Page 1 (limit=1): 1 row, nextCursor present: true
- Page 2: nextCursor present: false
- Pages do not overlap: true ([["prop_317767a2d99827fb63f5315b"],["prop_32fb5264f6e70df4c95f8f0b"]])
- Pending after two runs (one decided): 2

#### posts/generate - perTone 2, for a second page

`POST /orgs/611/alphastudio/posts/generate` → **202**
> two drafts, so the ledger has enough rows to page

```json
{
  "runId": "run_cfcc0c83518e88afb49aa47d",
  "capability": "social-posts.generate",
  "capabilityVersion": 4,
  "mode": "batch",
  "status": "queued",
  "outputs": [],
  "modelVersions": [],
  "promptVersions": [],
  "createdAt": "2026-08-19T05:47:36.695Z",
  "updatedAt": "2026-08-19T05:47:36.695Z"
}
```

#### cursor walk - limit=1, page 1

`GET /orgs/611/alphastudio/proposals?limit=1` → **200**

```json
{
  "proposals": [
    {
      "proposalId": "prop_317767a2d99827fb63f5315b",
      "runId": "run_cfcc0c83518e88afb49aa47d",
      "outputIndex": 0,
      "content": "Step into our roastery floor today and discover the latest addition to our collection: a carefully crafted roast from the lush farms of Ethiopia. The air is filled with the enticing aroma of freshly ground beans, inviting you to indulge in a rich and flavorful coffee experience. #CoffeeJourney #EthiopianBlend",
      "key": "286",
      "state": "pending",
      "reason": null,
      "publishedId": null,
      "createdAt": "2026-08-19T05:47:43.595Z",
      "decidedAt": null
    }
  ],
  "nextCursor": "MjAyNi0wOC0xOVQwNTo0Nzo0My41OTVaI3Byb3BfMzE3NzY3YTJkOTk4MjdmYjYzZjUzMTVi"
}
```

#### cursor walk - page 2

`GET /orgs/611/alphastudio/proposals?limit=1&cursor=MjAyNi0wOC0xOVQwNTo0Nzo0My41OTVaI3Byb3BfMzE3NzY3YTJkOTk4MjdmYjYzZjUzMTVi` → **200**
> the cursor is opaque and passed back verbatim

```json
{
  "proposals": [
    {
      "proposalId": "prop_32fb5264f6e70df4c95f8f0b",
      "runId": "run_393115077bd9df42be68e747",
      "outputIndex": 0,
      "content": "Today, we're excited to announce our latest roast, sourced from the vibrant farms of Ethiopia. The aroma of freshly ground beans fills our roastery floor, promising a rich and flavorful experience. #CoffeeLove #EthiopianRoast",
      "key": "smoke-tone",
      "state": "declined",
      "reason": "Changed our mind after posting.",
      "publishedId": "mlk_prop_32fb5264f6e70df4c95f8f0b",
      "createdAt": "2026-08-19T05:46:38.985Z",
      "decidedAt": "2026-08-19T05:46:49.622Z"
    }
  ]
}
```

#### proposals - state=pending after the second run

`GET /orgs/611/alphastudio/proposals?state=pending` → **200**
> the review queue as Today will read it

```json
{
  "proposals": [
    {
      "proposalId": "prop_317767a2d99827fb63f5315b",
      "runId": "run_cfcc0c83518e88afb49aa47d",
      "outputIndex": 0,
      "content": "Step into our roastery floor today and discover the latest addition to our collection: a carefully crafted roast from the lush farms of Ethiopia. The air is filled with the enticing aroma of freshly ground beans, inviting you to indulge in a rich and flavorful coffee experience. #CoffeeJourney #EthiopianBlend",
      "key": "286",
      "state": "pending",
      "reason": null,
      "publishedId": null,
      "createdAt": "2026-08-19T05:47:43.595Z",
      "decidedAt": null
    },
    {
      "proposalId": "prop_3113054ea601f3fb8feba60b",
      "runId": "run_cfcc0c83518e88afb49aa47d",
      "outputIndex": 1,
      "content": "Step into our roastery and breathe in the aroma of our newest blend, fresh off the roast from the lush Ethiopian highlands. Each cup is a journey through vibrant flavors and rich traditions. #CoffeeJourney #EthiopianBlend",
      "key": "286",
      "state": "pending",
      "reason": null,
      "publishedId": null,
      "createdAt": "2026-08-19T05:47:43.595Z",
      "decidedAt": null
    }
  ]
}
```

### ⚠ BACKEND BUG — keyset paging loses rows that share a timestamp

Found walking the cursor during INT-12 STEP 0. **Reported, and INT-12 is
designed around it.**

**Ground truth on the probe org (611): 3 proposals.** Two of them
(`prop_317767a2…`, `prop_3113054e…`) come from the SAME run
(`run_cfcc0c83…`, `perTone: 2`) and therefore share a creation instant.

| Walk | Rows returned | Verdict |
| ---- | ------------- | ------- |
| `?limit=200` (no paging) | 3 | correct |
| `?limit=2` walk | 3 (2 + 1) | correct |
| `?limit=1` walk | **2** — `prop_3113…` never appears | **row lost** |
| `?state=pending&limit=1` walk | **1 of 2**; page 2 returns `[]` with no cursor | **row lost** |

**The cause is visible in the cursor itself.** It decodes to:

```
2026-08-19T05:47:43.595Z#prop_317767a2d99827fb63f5315b
```

— so the tie-breaking id IS carried. But the next page evidently compares on
the TIMESTAMP alone (strictly `<`), skipping every row sharing that instant
instead of continuing after `(timestamp, id)`. A page boundary that falls
inside a group of same-instant rows drops the rest of the group.

**Why this matters more here than it looks.** Proposals from one run are
created together, so a single `generate` with `perTone: 2`, or with 2–3 tones,
produces a cluster of same-instant rows. A boundary landing mid-cluster makes
drafts disappear from the review queue with no error and no gap to notice —
the exact failure mode a review screen must not have.

**What the frontend does about it (D-INT-J).** Never trust a paged ledger for
completeness:

1. page with `limit=200` (the max) purely to DISCOVER `runId`s;
2. then query `?runId=<id>` per run — that returns the run's whole set, is
   boundary-free at these sizes (≤6 rows), and carries no cursor at all — and
   treat THAT as the authoritative state.

The per-run query was verified boundary-free here: `run_cfcc0c83…` → 2 rows and
no `nextCursor`; `run_393115077…` → 1 row and no `nextCursor`.

Residual risk, stated plainly: a run whose *entire* row group is lost by a
page boundary would never be discovered at all. That needs >200 rows in the
window AND a boundary landing exactly on one run's whole cluster. It is
accepted for now, and it disappears the moment the tie-break is fixed
server-side — no frontend change needed.

## Upstream target envelope — Hasan sync 2026-08-28 (structure authoritative, values illustrative)

Founder-supplied reference for the `POST .../alphastudio/posts/generate` body,
directly from Hasan (AlphaStudio upstream owner). The STRUCTURE is the
contract; the values are Postman samples. HSN-01's only wire change was
removing `options.perTone` (the emptied `options` wrapper with it); later HSN
orders converge the rest of the body on this envelope step by step — do not
rewrite the sections above to match it.

> **Tones — `language` + `length` (2026-08-30, ORDER HSN-03).** App-side
> AHEAD of the backend as of this order: `POST`/`PATCH /orgs/:id/brand/tones`
> still persist only `{name, description, preset, rules}` (api.md §Brand), so
> the two fields live in a client sidecar (`ab-tone-fields:<orgId>` →
> `{ [toneId]: { language, length } }`, `src/data/adapters/tone-fields.ts`)
> and the wire send is implemented but DISABLED behind `TONE_FIELDS_ON_WIRE`
> in `src/data/brand.ts` — one line to flip when Hasan confirms persistence;
> a server-echoed value then wins and the sidecar entry retires. The generate
> body below carries `length` (`short` | `medium` | `long` — `medium` is
> founder-stated) per this reference, OMITTED for a tone that has none, and
> keeps sending per-tone `language` (`"ar"` | `"en"`, the vocabulary it
> always sent) which the reference does not show. The `social-posts.media`
> tone object is untouched — no `length`, no `language` there.

```json
{
  "slot": {
    "ref": "postman-slot-1",
    "dateISO": "2026-02-03",
    "time": "09:00",
    "timezone": "Asia/Riyadh"
  },
  "tones": [
    {
      "id": "executive",
      "name": "Executive Brief",
      "length": "long",
      "description": "For a CDO, CFO or government programme owner. Opens on the exposure — cost, regulatory reporting, AI-readiness — then the platform, then one clear next step.",
      "rules": [
        { "kind": "do", "text": "Open with the number or the exposure, and close with a single next step such as info@alphapromena.com." }
      ]
    },
    {
      "id": "practitioner",
      "name": "Practitioner",
      "length": "short",
      "description": "For the data-quality owner who will actually run the platform. Specific about which capability does the work and what it removes from their week.",
      "rules": [
        { "kind": "do", "text": "Name the specific mechanism — auto-generated quality rules, anomaly flagging, fixes executed at source — not the category." },
        { "kind": "dont", "text": "No rhetorical questions and no analogies; state the mechanism plainly." }
      ]
    }
  ],
  "plan": "balanced",
  "attachedEvent": {
    "title": "Ataccama named a Leader in The Forrester Wave: Data Quality Solutions, 2026, with the highest score in Strategy",
    "dateISO": "2026-01-28",
    "rules": [
      { "kind": "do", "text": "Name the analyst firm and the exact recognition; it is the whole point of the post." },
      { "kind": "dont", "text": "Do not imply the recognition covers products or categories it does not." }
    ]
  }
}
```

## Upstream presign envelope — Hasan meeting chat 2026-08-28

Founder-supplied, verbatim from Hasan's meeting chat (recorded for ORDER
HSN-04, 2026-08-30). The presign body carries a `desc` — the user's own
description of the uploaded thing — beside `mediaType`, which derives from
the REAL file. The key name is `desc`, exactly.

```json
{ "mediaType": "image/png", "desc": "<user's description>" }
```

What the app sends as of HSN-04: the Knowledge upload's presign — the RAG
door, `POST .../rag/collections/:id/sources/presign` — carries
`{ filename, mediaType, desc }`, with NO disable switch by the founder's
word (decisions.md HSN-04; note that Phase 0 found this door HEALTHY on
2026-08-30 — `ok 201` in the sweep — where open-item 43's media door was
the broken one). The media door, `POST .../media/assets/presign` (body
`{ mediaType }`, `uploadReferenceImage` in `src/data/studio.ts`, no UI
caller today), is untouched pending the founder's next-order ruling. The
final gate probes both — and did; the record follows.

## HSN-FINAL Phase 0 — both presign doors probed with `desc` (2026-08-30)

Fresh isolated QA org **1415** (`qa+1788095922469hsnfinal@alphapromena.com`,
user 1778, membership 1635; org 619 untouched). Presign only — no byte `PUT`,
no job, no run; every minted row deleted afterwards. Bodies verbatim, urls
and the token redacted.

### P1 — media door WITH `desc` (Hasan's meeting-chat body) → **201**

`POST /orgs/1415/alphastudio/media/assets/presign` · request-id
`45f67ae4-d154-481a-aaba-f73a4d63f19d` · 826 ms

```json
{"mediaType":"image/png","desc":"HSN-FINAL probe P1 — a reference image"}
```

```json
{
  "assetId": "masset_adb3fe2af9067cead02c329d",
  "uploadUrl": "<redacted uploadUrl: 1639 chars>",
  "expiresAt": "2026-08-30T13:33:49.916Z",
  "mediaType": "image/png"
}
```

### P1-control — the same door, the open-item 43 body (no `desc`) → **400**

Same org, same minute. `POST /orgs/1415/alphastudio/media/assets/presign` ·
request-id `99de0be4-2c05-4a4a-911b-0d0fee9d9cef` · 873 ms

```json
{"mediaType":"image/png"}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "99de0be4-2c05-4a4a-911b-0d0fee9d9cef"
  }
}
```

**Verdict: the missing `desc` WAS the regression.** One field, same door,
201 with it and 400 without it, on the same org in the same minute.
Open-item 43 is SOLVED-PENDING-WARD-CONFIRM. (Cleanup: `DELETE
/media/assets/masset_adb3fe2af9067cead02c329d` → 204, request-id
`7b479a19-7123-4ee3-a4ba-b3bb6dfc7637`.)

### P2 — RAG door WITH `desc` (the HSN-04 shape) → **201**

Scratch collection `col_1c3a617d8d6a4e3e8479160163cb4fcf` (`POST
/rag/collections` → 201, request-id `ff71b923-cd36-4e73-a84f-d6041a8379c8`).
`POST /orgs/1415/alphastudio/rag/collections/col_1c3a…/sources/presign` ·
request-id `d77dd2b2-2f03-42c3-804d-e5b1de0dda9c` · 804 ms

```json
{"filename":"probe-p2.txt","mediaType":"text/plain","desc":"HSN-FINAL probe P2 — roasting notes"}
```

```json
{
  "sourceId": "src_1c6a488fbcd7444194f3efbfe46675ec",
  "uploadUrl": "<redacted uploadUrl: 1651 chars>",
  "expiresAt": "2026-08-30T13:33:53.341Z",
  "mediaType": "text/plain"
}
```

**Verdict: `desc` is tolerated on the RAG door; the built shape stands, no
revert.** (Cleanup: `DELETE /rag/sources/src_1c6a…` → 200
`{ "vectorsDeleted": 0 }`, request-id `540866e9-6b03-4577-a517-0bb72e49c7e1`.)

### P2 observations — Image and Video on the RAG door → **400**, both

The HSN-04 form offers Image | Video | Document; decisions.md HSN-04 said the
final gate observes whether the RAG door takes the first two. It does not:

- `{"filename":"probe-p2.png","mediaType":"image/png","desc":"…"}` → **400**
  request-id `d7553931-3b03-46ea-b656-b14abc41ca77`
- `{"filename":"probe-p2.mp4","mediaType":"video/mp4","desc":"…"}` → **400**
  request-id `3182f312-c962-4cb9-9fca-c3e9d93e50f3`

Both with the same envelope:

```json
{
  "error": {
    "code": "bad_request",
    "message": "The knowledge service rejected the request — check the body (e.g. a name already used, or a media type it cannot extract)",
    "requestId": "d7553931-3b03-46ea-b656-b14abc41ca77"
  }
}
```

So on the live Knowledge screen an Image or Video upload is refused by the
wire before any byte leaves the browser, and the refusal shows inline —
which is the honest behaviour the form was built to show. Whether the RAG
door should accept them is Hasan's side; nothing was changed here.

## Upstream social-posts.media envelope — Hasan sync 2026-08-28 (structure authoritative, values illustrative)

Founder-supplied reference for the `POST .../alphastudio/media/jobs` body with
`capability: "social-posts.media"`, directly from Hasan (AlphaStudio upstream
owner), recorded for ORDER HSN-02 (2026-08-30). The STRUCTURE is the contract;
the values are Hasan's hand-test samples. What the app derives and what it lets
the user edit is decided in `src/data/studio.ts` (`buildPostVisualRequest`):
`posts` is EXACTLY ONE entry (PROBE-INT13: the multi-post path billed and then
502'd), `params` is always `{}`, `collection` is always `{ "use": false }` by
the founder's word, and `guidance` is at most six strings. The 202 receipt for
this body has NEVER been observed — see the PROBE-INT13 section above — and
the ruling is that it answers `{ "jobs": [...] }` even for one post.

### image

```json
{
  "capability": "social-posts.media",
  "plan": "balanced",
  "kind": "image",
  "posts": [
    {
      "ref": "hand-test-draft-precise",
      "content": "Most enterprises are deploying agentic AI before the governance foundations are in place to manage it safely. Deloitte found that 74% of companies plan to deploy autonomous agents at moderate or significant scale within two years — yet only 21% have a mature governance model to support them.\n\nThe risk is structural. Agents that act on poorly classified, uncertified or untracked data don't just make mistakes — they make them faster and at greater scale. Governance here is not a compliance checkbox. It is the mechanism that determines whether agentic AI creates value or operational exposure.\n\nThe enterprises that move confidently are the ones treating data quality, lineage and access control as runtime requirements, not pre-launch reviews.",
      "tone": {
        "id": "executive",
        "name": "Executive / Thought Leadership",
        "description": "Confident, concise, business-first writing for executives and decision-makers.",
        "rules": [
          { "kind": "do", "text": "Lead with a strong business observation" },
          { "kind": "do", "text": "Use short, decisive paragraphs" },
          { "kind": "do", "text": "Connect AI/data topics to business impact" },
          { "kind": "do", "text": "Sound experienced, not promotional" },
          { "kind": "dont", "text": "Sound like a vendor pitch" },
          { "kind": "dont", "text": "Overuse technical jargon" },
          { "kind": "dont", "text": "Use hype language" },
          { "kind": "dont", "text": "Open with “We're excited” or “We're thrilled”" }
        ]
      }
    }
  ],
  "style": { "imgStyle": "Cinematic", "text": true, "logo": true },
  "guidance": [ "show the alphapromena logo and the ataccama logo in good way" ],
  "params": {},
  "collection": { "use": false }
}
```

### video — identical, with `"kind": "video"`

```json
{
  "capability": "social-posts.media",
  "plan": "balanced",
  "kind": "video",
  "posts": [
    {
      "ref": "hand-test-draft-precise",
      "content": "Most enterprises are deploying agentic AI before the governance foundations are in place to manage it safely. Deloitte found that 74% of companies plan to deploy autonomous agents at moderate or significant scale within two years — yet only 21% have a mature governance model to support them.\n\nThe risk is structural. Agents that act on poorly classified, uncertified or untracked data don't just make mistakes — they make them faster and at greater scale. Governance here is not a compliance checkbox. It is the mechanism that determines whether agentic AI creates value or operational exposure.\n\nThe enterprises that move confidently are the ones treating data quality, lineage and access control as runtime requirements, not pre-launch reviews.",
      "tone": {
        "id": "executive",
        "name": "Executive / Thought Leadership",
        "description": "Confident, concise, business-first writing for executives and decision-makers.",
        "rules": [
          { "kind": "do", "text": "Lead with a strong business observation" },
          { "kind": "do", "text": "Use short, decisive paragraphs" },
          { "kind": "do", "text": "Connect AI/data topics to business impact" },
          { "kind": "do", "text": "Sound experienced, not promotional" },
          { "kind": "dont", "text": "Sound like a vendor pitch" },
          { "kind": "dont", "text": "Overuse technical jargon" },
          { "kind": "dont", "text": "Use hype language" },
          { "kind": "dont", "text": "Open with “We're excited” or “We're thrilled”" }
        ]
      }
    }
  ],
  "style": { "imgStyle": "Cinematic", "text": true, "logo": true },
  "guidance": [ "show the alphapromena logo and the ataccama logo in good way" ],
  "params": {},
  "collection": { "use": false }
}
```

## MED-0831 Phase 0 — the media door measured in full (2026-08-31)

Two fresh isolated QA orgs — **1611** (`qa+1788169635185med@alphapromena.com`,
P1/P2/P3) and **1612** (`qa+1788169728359medb@alphapromena.com`, the P3b
supplement) — org 619 untouched. Zero spend throughout: presigns (not
billable), one 70-byte storage `PUT` (free), list reads, deletes. No job, no
run, no render. Bodies verbatim; presigned urls and the token redacted. The
order expected the 14xx org range; the API is minting 16xx now — same fresh
isolation either way.

### P1 — presign per media type, `desc` present, no bytes → **201, ALL EIGHT**

`POST /orgs/1611/alphastudio/media/assets/presign`, one call per type, each
body `{"mediaType":"<type>","desc":"MED-0831 probe P1 — <type>"}`:

| mediaType                                                                 | status  | assetId                           | request-id                             | ms  |
| ------------------------------------------------------------------------- | ------- | --------------------------------- | -------------------------------------- | --- |
| `image/png`                                                               | **201** | `masset_a20f75e8a2c89ff7a9b6c8fd` | `4f16ce68-543c-4643-8ba9-d3e4f6b68f8a` | 821 |
| `image/jpeg`                                                              | **201** | `masset_94ab21cb9f5e9f529401ed6c` | `75a4d16b-6a84-46f8-97be-bb32cab7a569` | 792 |
| `image/webp`                                                              | **201** | `masset_06ec3922a65192fe327b6872` | `0ba36c59-150e-471e-8fff-19bedc6fd3e8` | 740 |
| `video/mp4`                                                               | **201** | `masset_e794a06b2521319d590cf5cc` | `4fe63dc4-c242-45b6-aef7-c07803fd5f22` | 743 |
| `application/pdf`                                                         | **201** | `masset_f27dfb9455ee84a614341f45` | `2ccc3b04-065c-4365-98f7-ac3bcb8e212f` | 743 |
| `text/plain`                                                              | **201** | `masset_5c3994179938f2d6729073e9` | `d983f966-0825-4a2c-b290-f53c63958db4` | 740 |
| `text/markdown`                                                           | **201** | `masset_2273a542fd0425c5a22a04ca` | `a82875df-f503-4b3e-b315-43108573b789` | 758 |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | **201** | `masset_c629abd138b8a7dc618ed316` | `13618d09-ed8f-4654-8093-2139a611dbde` | 750 |

Every 201 answered the P1 ticket shape (representative, `image/png`):

```json
{
  "assetId": "masset_a20f75e8a2c89ff7a9b6c8fd",
  "uploadUrl": "<redacted uploadUrl: 1689 chars>",
  "expiresAt": "2026-08-31T10:02:22.397Z",
  "mediaType": "image/png"
}
```

**Finding: the media door filters NOTHING by type at presign time.** H4's
png/jpeg/webp/mp4 set is therefore a PRODUCT allowlist (H1 routes documents
to the RAG door), not a wire constraint. The presign expiry is ~15 minutes,
as on the RAG door.

**P1 cleanup — every never-uploaded asset deletes cleanly, 204 × 8:**
`41835f84-cd70-4345-b955-19a62fbc6cc2` (png) ·
`5d177719-4b03-4535-87dd-8ae7b707d820` (jpeg) ·
`e1e88b90-cfa9-485d-abf4-5742269ef9cc` (webp) ·
`46faec6d-0670-46d1-a0c0-afb1d5320e52` (mp4) ·
`9db99d4a-dc55-431c-93ac-146191e715af` (pdf) ·
`6975701f-781b-4159-be4e-a33400968533` (plain) ·
`48370352-96dd-41f5-963b-565526e84732` (markdown) ·
`29324790-ec28-4118-a1c0-b80f7592faab` (docx).

### P2 — one full lifecycle, clean end to end

1. **Presign** `POST /orgs/1611/alphastudio/media/assets/presign` → **201** ·
   request-id `44e2af12-b6ed-422f-8964-2a34cbc43082` · 744 ms

   ```json
   {"mediaType":"image/png","desc":"MED-0831 probe P2 — a 1x1 PNG lifecycle"}
   ```

   ```json
   {
     "assetId": "masset_f84f6d79c5c7ef90e1d070ee",
     "uploadUrl": "<redacted uploadUrl: 1689 chars>",
     "expiresAt": "2026-08-31T10:02:34.562Z",
     "mediaType": "image/png"
   }
   ```

2. **PUT the bytes** (from Node, `content-type` exactly the ticket's
   `mediaType`) → **200**. A 1×1 transparent PNG, **70 bytes** (the probe
   script's own comment said 68; the buffer is 70 — recorded honestly).
3. **Read-presign** `POST .../media/assets/masset_f84f6d79c5c7ef90e1d070ee/presign`
   → **200** · request-id `994c0f2a-d704-4770-936b-10c2c5f71beb`. NOTE the
   download ticket's key is `url` (not `uploadUrl`) and the expiry is ~1 hour:

   ```json
   {
     "assetId": "masset_f84f6d79c5c7ef90e1d070ee",
     "url": "<redacted url: 1649 chars>",
     "expiresAt": "2026-08-31T10:47:35.823Z"
   }
   ```

4. **GET the url** → **200**, `content-type: image/png`, 70 bytes back — the
   same object that went up.
5. **DELETE** `.../media/assets/masset_f84f6d79c5c7ef90e1d070ee` → **204** ·
   request-id `ec33072e-9062-4b74-b9a9-5865dfd3b218`.
6. **Read-presign AFTER the delete — what "gone" looks like** → **404**:

   ```json
   {
     "error": {
       "code": "not_found",
       "message": "Asset not found",
       "requestId": "c382b5a5-ecbc-4424-acd8-9c16195ad818"
     }
   }
   ```

### P3 — the read-back list ANSWERS NOW: **200, not 502** (Ward item 4 apparently fixed)

Run between P2's upload and P2's delete, so the strongest version of both
checks. `GET /orgs/1611/alphastudio/media/assets` → **200** · request-id
`c09531e7-fc46-413b-8be1-b903236b448b` · 752 ms:

```json
{
  "assets": [
    {
      "assetId": "masset_f84f6d79c5c7ef90e1d070ee",
      "kind": "image",
      "desc": "MED-0831 probe P2 — a 1x1 PNG lifecycle",
      "meta": {
        "synthetic": false
      }
    }
  ]
}
```

**The 502 this order (and Ward item 4) expected is not what the wire says
today.** The row shape carries `assetId`, `kind` (a word, not the exact
mediaType), `desc` and `meta.synthetic` — **no mediaType, no uploadedAt, no
date of any kind**, which matters for H2's "Files" row (description · type ·
date): the wire list cannot fill the date column and only kinds the type.

`GET /orgs/1611/alphastudio/media/jobs` → **200** · request-id
`8b49e097-3af9-4912-b430-cf8800592698` — `{"jobs": []}` while the uploaded
asset existed. **Uploads do NOT appear as jobs**, as expected.

### P3b supplement — a NEVER-UPLOADED presign appears in the list (org 1612)

Because Phase 2 must know what a failed `PUT` leaves behind. Fresh org 1612:
presign `image/png` with `desc: "MED-0831 probe P3b — never uploaded"` →
**201** `masset_b1d54926355990d00b4d421f` (request-id
`f226694a-d250-4302-9459-451ad65f1368`), NO bytes sent, then
`GET .../media/assets` → **200** (request-id
`f720d213-bb46-40ac-9699-c15808e50b48`):

```json
{
  "assets": [
    {
      "assetId": "masset_b1d54926355990d00b4d421f",
      "kind": "image",
      "desc": "MED-0831 probe P3b — never uploaded",
      "meta": {
        "synthetic": false
      }
    }
  ]
}
```

**The row is minted at PRESIGN time, not when the bytes land** — a failed or
abandoned `PUT` leaves a phantom row in the wire list, indistinguishable in
this shape from a real upload. DELETE → **204** (request-id
`3442381f-623e-49f9-9c66-31e03b50b417`), list re-read → `{"assets": []}`
(request-id `1118b507-873d-42e6-88aa-c35091a979cc`). So Phase 1's law — a
failed PUT reports the minted asset id — has a second reason to exist: the
id is also the handle for cleaning the phantom row up.
