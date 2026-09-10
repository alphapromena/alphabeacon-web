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
the founder's word — **SUPERSEDED 2026-08-31 (MED-0831 ruling H5): the
founder reversed it in person; `collection` is now always `{ "use": true }`,
one constant (`VISUAL_COLLECTION`), and the first proof a render draws on
the collection is his own `LIVE_MEDIA=1` render** — and `guidance` is at
most six strings. The 202 receipt for
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

## MED-0831/R — `role` on the media presign (Hasan addendum, 2026-08-31) — ASSUMED then, MEASURED 2026-09-02

Hasan's same-day addendum, delegated to assumption and founder-approved
(ORDER MED-0831/R, the fast-path ruling): NO wire call was made before
shipping — the founder tests on production with Hasan, and a wrong
assumption here must fail VISIBLY there. Every line below was **ASSUMED
until Hasan's production review** — and was then **MEASURED on 2026-09-02
(ORDER HSN-0902 Phase 0, fresh org 1692; the section at the end of this
file):** A1 holds — the key is `role`, the door answers 201 with `"logo"`
and with `"brandkit"` (a second value exists now), and 400 `bad_request`
for `"brandkit"` on a PNG (it binds that role to `application/pdf`,
request `00e65eaa-21bb-4741-99f8-b8668621b77c`). **A2 is ANSWERED —
`GET …/media/assets` ECHOES `role`** (`"logo"` on request
`7c0d1b42-aa9d-455d-b692-1d603c2dd486`, `"brandkit"` on request
`16dec457-c3a3-4171-8a5d-8b84ee108333`, the row shape
`{assetId, kind, desc, role, meta}`). A3 and A4 are app-side rulings and
stand unchanged.

```json
{ "mediaType": "image/png", "desc": "<user's description>", "role": "logo" }
```

- **A1** — the field is `role` on the presign body; the only value today is
  `"logo"` (**since HSN-0902: `"logo"` or `"brandkit"`, both measured**).
  When the upload is neither the key is OMITTED — never null. The app's
  body is a closed set either way (`uploadMediaAsset`, unit-asserted).
- **A2** — **ANSWERED 2026-09-02: the list ECHOES `role`.** (As assumed on
  2026-08-31: whether `GET .../media/assets` echoes `role` was UNKNOWN.) The
  app reads it — the Files badge lights from the echo — and the org logo
  keeps the exact-`desc: "logo"` lookup as the read-side truth regardless
  (one marker to scan, kept unique by the reserved word), which is why the
  org logo sends BOTH markers. H3's conflict rule (more than one desc-"logo"
  row is shown, never picked from) stands.
- **A3** — the same `"logo"` role serves the org logo AND Knowledge images
  the user marks as logos (partner/product marks). Logo-marked Knowledge
  images stay in the Files section (badge `logo` only when the row echoes
  the role); the `"logo"` DESCRIPTION reservation stays.
- **A4** — Knowledge offers the mark as a checkbox ("This image is a
  logo"), Image only, never Video, unchecked by default; Organization
  always sends the role, no control.

## HSN-0902 Phase 0 — brand kit role, durationS, and the org fields (2026-09-02)

Captured by `pnpm tsx scripts/probe-hsn-0902.ts` against the deployed SANDBOX API on one
fresh QA org — **1692** (`qa+1788350803187hsn@alphapromena.com`) — org 619 untouched. Zero spend:
presigns, one free Node PUT, list reads, deletes, org reads and PATCHes, and five
generation bodies sent ONLY behind the zero-wallet shield (each refused before any
spend; the wallet and the job list are re-read after). Bodies verbatim; presigned
urls and the token redacted. Request-ids are the server's `x-request-id` (or the
envelope's `requestId` on an error). Run stamp: `2026-09-02T12:06:43.187Z`.

### What this run established

- Fresh QA org: id 1692 ("QA HSN-0902 Org 1788350803187").
- Wallet on the fresh org: 200 {"cents":0,"heldCents":0,"availableCents":0}.
- P1 brand-kit presign (PDF): 201 assetId=masset_1b77cd881a3c314a0571ca38 mediaType=application/pdf.
- Storage CORS for http://localhost:5199: 200; allow-origin=*; allow-methods=PUT.
- Storage CORS for https://1.malaky.ai: 200; allow-origin=*; allow-methods=PUT.
- Node PUT of a 191-byte PDF: 200.
- P1 list after the PDF presign: 200; the brand-kit row is listed with keys [assetId, kind, desc, role, meta]; kind="document"; role ECHOED as "brandkit".
- P1 read-presign of the PDF asset: 200.
- P1 DELETE: 204.
- P1 list re-read: 200 {"assets":[]}.
- P1b role "brandkit" on a PNG: 400 code=bad_request — the door binds role to type.
- A2 (role "logo" echo): row keys [assetId, kind, desc, role, meta]; role ECHOED as "logo".
- video, params:{durationS:8} (Hasan’s example; 402 expected): 402 code=wallet_insufficient.
- video, params:{durationS:"abc"} (400 = validated before the wallet): 400 code=bad_request.
- video, params:{durationS:999} (400 = a max is enforced before the wallet): 400 code=bad_request.
- image, NO params key (the ruled image body): 402 code=wallet_insufficient.
- image, params:{} (HSN-02’s shape, the control): 402 code=wallet_insufficient.
- P2 after: wallet {"cents":0,"heldCents":0,"availableCents":0}; jobs listed: 0.
- P3 org record keys before: [id, name, slug, status, createdAt, updatedAt, country].
- P3a fields alone: PATCH 400 code=validation_failed; read-back carries NEITHER field.
- P3b fields beside name: PATCH 200 (PATCH response does not carry the fields); read-back carries NEITHER field.
- P3c org-profile sweep (read-only): /orgs/:id/alphastudio/profile → 404 · /orgs/:id/alphastudio/org → 404 · /orgs/:id/alphastudio/organization → 404 · /orgs/:id/alphastudio/brand → 404 · /orgs/:id/alphastudio/context → 404 · /orgs/:id/profile → 404 · /orgs/:id/brand/profile → 404.
- P3d NOT RUN: no door echoed the fields, so there are no limits to measure.

### Captured exchanges, in order

#### create org

`POST /orgs` → **201** · request-id `f36f0437-2956-4f93-8102-8944767b6c82`
> the fresh QA org every probe below runs on

```json
{
  "request": {
    "name": "QA HSN-0902 Org 1788350803187"
  },
  "response": {
    "org": {
      "id": "1692",
      "name": "QA HSN-0902 Org 1788350803187",
      "slug": "qa-hsn-0902-org-1788350803187",
      "status": "active",
      "createdAt": "2026-09-02T12:06:47.431Z",
      "updatedAt": "2026-09-02T12:06:47.431Z",
      "country": null
    },
    "membership": {
      "id": "1934",
      "orgId": "1692",
      "userId": "2070",
      "role": "owner",
      "isActive": true,
      "createdAt": "2026-09-02T12:06:47.431Z",
      "updatedAt": "2026-09-02T12:06:47.431Z"
    }
  }
}
```

#### wallet — the fresh org (the 402 shield)

`GET /orgs/1692/alphastudio/wallet` → **200** · request-id `6592aacf-bc22-43e1-b375-d438ceb854e2`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

#### P1 · media/assets/presign — application/pdf, desc "brandkit", role "brandkit"

`POST /orgs/1692/alphastudio/media/assets/presign` → **201** · request-id `6a701429-7b4a-4e1d-a0bd-08bbabcfcffe`

```json
{
  "request": {
    "mediaType": "application/pdf",
    "desc": "brandkit",
    "role": "brandkit"
  },
  "response": {
    "assetId": "masset_1b77cd881a3c314a0571ca38",
    "uploadUrl": "<redacted: 1663 chars>",
    "expiresAt": "2026-09-02T12:21:51.649Z",
    "mediaType": "application/pdf"
  }
}
```

#### P1 · storage CORS preflight (OPTIONS, from Node) — Origin http://localhost:5199

`OPTIONS (presigned storage url — not our API)` → **200** · request-id `none`
> what Chromium would be told before its PUT; browser truth is still the browser’s

```json
{
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "PUT",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "3000"
}
```

#### P1 · storage CORS preflight (OPTIONS, from Node) — Origin https://1.malaky.ai

`OPTIONS (presigned storage url — not our API)` → **200** · request-id `none`
> what Chromium would be told before its PUT; browser truth is still the browser’s

```json
{
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "PUT",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "3000"
}
```

#### P1 · PUT a tiny PDF to the media presigned url (from Node — NOT browser truth)

`PUT (presigned storage url — not our API)` → **200** · request-id `none`
> 191 bytes, content-type exactly the ticket's mediaType

#### P1 · media/assets — list (does the row echo role?)

`GET /orgs/1692/alphastudio/media/assets` → **200** · request-id `16dec457-c3a3-4171-8a5d-8b84ee108333`

```json
{
  "assets": [
    {
      "assetId": "masset_1b77cd881a3c314a0571ca38",
      "kind": "document",
      "desc": "brandkit",
      "role": "brandkit",
      "meta": {
        "synthetic": false
      }
    }
  ]
}
```

#### P1 · media/assets/:id/presign — download url for the PDF

`POST /orgs/1692/alphastudio/media/assets/masset_1b77cd881a3c314a0571ca38/presign` → **200** · request-id `294385c3-1eb2-4d63-9ecc-c5bad31ca069`

```json
{
  "assetId": "masset_1b77cd881a3c314a0571ca38",
  "url": "<redacted: 1663 chars>",
  "expiresAt": "2026-09-02T13:06:54.457Z"
}
```

#### P1 · media/assets/:id — DELETE the brand kit

`DELETE /orgs/1692/alphastudio/media/assets/masset_1b77cd881a3c314a0571ca38` → **204** · request-id `49690517-9221-422d-917c-21a3fde77f05`
> expected 204

#### P1 · media/assets — list re-read after the delete

`GET /orgs/1692/alphastudio/media/assets` → **200** · request-id `3b45a9f5-6a91-4d31-85c2-13b280339ab4`

```json
{
  "assets": []
}
```

#### P1b · media/assets/presign — image/png, desc "brandkit", role "brandkit"

`POST /orgs/1692/alphastudio/media/assets/presign` → **400** · request-id `00e65eaa-21bb-4741-99f8-b8668621b77c`

```json
{
  "request": {
    "mediaType": "image/png",
    "desc": "brandkit",
    "role": "brandkit"
  },
  "response": {
    "error": {
      "code": "bad_request",
      "message": "The media service rejected the request — check the body against the capability's schema",
      "requestId": "00e65eaa-21bb-4741-99f8-b8668621b77c"
    }
  }
}
```

#### P1c · media/assets/presign — image/png, desc "logo", role "logo" (the org logo’s exact body)

`POST /orgs/1692/alphastudio/media/assets/presign` → **201** · request-id `a926b26e-60fb-4233-9dd9-86f9c914d61c`

```json
{
  "request": {
    "mediaType": "image/png",
    "desc": "logo",
    "role": "logo"
  },
  "response": {
    "assetId": "masset_ac2ba1dc80eda758793cf1c4",
    "uploadUrl": "<redacted: 1663 chars>",
    "expiresAt": "2026-09-02T12:21:57.354Z",
    "mediaType": "image/png"
  }
}
```

#### P1c · media/assets — list (the logo row)

`GET /orgs/1692/alphastudio/media/assets` → **200** · request-id `7c0d1b42-aa9d-455d-b692-1d603c2dd486`

```json
{
  "assets": [
    {
      "assetId": "masset_ac2ba1dc80eda758793cf1c4",
      "kind": "image",
      "desc": "logo",
      "role": "logo",
      "meta": {
        "synthetic": false
      }
    }
  ]
}
```

#### P1c · media/assets/:id — DELETE the logo probe row

`DELETE /orgs/1692/alphastudio/media/assets/masset_ac2ba1dc80eda758793cf1c4` → **204** · request-id `cf8dee3c-9625-4ce1-bf08-665303de85ef`
> expected 204

#### P2a · media/jobs — video, params:{durationS:8} (Hasan’s example; 402 expected)

`POST /orgs/1692/alphastudio/media/jobs` → **402** · request-id `c08d315f-d8e4-46ff-8303-6532c353d552`
> sent ONLY because the wallet read 0 — the 402 shield

```json
{
  "request": {
    "capability": "social-posts.media",
    "plan": "balanced",
    "kind": "video",
    "posts": [
      {
        "ref": "hsn-0902-probe-draft",
        "content": "This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.",
        "tone": {
          "id": "hsn-0902-probe-tone",
          "name": "Roastery floor",
          "description": "Warm, specific, smells of coffee.",
          "rules": [
            {
              "kind": "do",
              "text": "Name the roast date"
            }
          ]
        }
      }
    ],
    "style": {
      "imgStyle": "Cinematic",
      "text": true,
      "logo": true
    },
    "guidance": [],
    "params": {
      "durationS": 8
    },
    "collection": {
      "use": true
    }
  },
  "response": {
    "error": {
      "code": "wallet_insufficient",
      "message": "The org's wallet cannot cover this request — not enough credits",
      "requestId": "c08d315f-d8e4-46ff-8303-6532c353d552"
    }
  }
}
```

#### P2b · media/jobs — video, params:{durationS:"abc"} (400 = validated before the wallet)

`POST /orgs/1692/alphastudio/media/jobs` → **400** · request-id `a13b2826-8794-4b89-872e-5fc99688731b`
> sent ONLY because the wallet read 0 — the 402 shield

```json
{
  "request": {
    "capability": "social-posts.media",
    "plan": "balanced",
    "kind": "video",
    "posts": [
      {
        "ref": "hsn-0902-probe-draft",
        "content": "This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.",
        "tone": {
          "id": "hsn-0902-probe-tone",
          "name": "Roastery floor",
          "description": "Warm, specific, smells of coffee.",
          "rules": [
            {
              "kind": "do",
              "text": "Name the roast date"
            }
          ]
        }
      }
    ],
    "style": {
      "imgStyle": "Cinematic",
      "text": true,
      "logo": true
    },
    "guidance": [],
    "params": {
      "durationS": "abc"
    },
    "collection": {
      "use": true
    }
  },
  "response": {
    "error": {
      "code": "bad_request",
      "message": "The media service rejected the request — check the body against the capability's schema",
      "requestId": "a13b2826-8794-4b89-872e-5fc99688731b"
    }
  }
}
```

#### P2c · media/jobs — video, params:{durationS:999} (400 = a max is enforced before the wallet)

`POST /orgs/1692/alphastudio/media/jobs` → **400** · request-id `7c0f8c45-61ab-40a6-b243-5fe54478693f`
> sent ONLY because the wallet read 0 — the 402 shield

```json
{
  "request": {
    "capability": "social-posts.media",
    "plan": "balanced",
    "kind": "video",
    "posts": [
      {
        "ref": "hsn-0902-probe-draft",
        "content": "This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.",
        "tone": {
          "id": "hsn-0902-probe-tone",
          "name": "Roastery floor",
          "description": "Warm, specific, smells of coffee.",
          "rules": [
            {
              "kind": "do",
              "text": "Name the roast date"
            }
          ]
        }
      }
    ],
    "style": {
      "imgStyle": "Cinematic",
      "text": true,
      "logo": true
    },
    "guidance": [],
    "params": {
      "durationS": 999
    },
    "collection": {
      "use": true
    }
  },
  "response": {
    "error": {
      "code": "bad_request",
      "message": "The media service rejected the request — check the body against the capability's schema",
      "requestId": "7c0f8c45-61ab-40a6-b243-5fe54478693f"
    }
  }
}
```

#### P2d · media/jobs — image, NO params key (the ruled image body)

`POST /orgs/1692/alphastudio/media/jobs` → **402** · request-id `5a74875a-e52c-426c-ad6d-b26ae594afef`
> sent ONLY because the wallet read 0 — the 402 shield

```json
{
  "request": {
    "capability": "social-posts.media",
    "plan": "balanced",
    "kind": "image",
    "posts": [
      {
        "ref": "hsn-0902-probe-draft",
        "content": "This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.",
        "tone": {
          "id": "hsn-0902-probe-tone",
          "name": "Roastery floor",
          "description": "Warm, specific, smells of coffee.",
          "rules": [
            {
              "kind": "do",
              "text": "Name the roast date"
            }
          ]
        }
      }
    ],
    "style": {
      "imgStyle": "Cinematic",
      "text": true,
      "logo": true
    },
    "guidance": [],
    "collection": {
      "use": true
    }
  },
  "response": {
    "error": {
      "code": "wallet_insufficient",
      "message": "The org's wallet cannot cover this request — not enough credits",
      "requestId": "5a74875a-e52c-426c-ad6d-b26ae594afef"
    }
  }
}
```

#### P2e · media/jobs — image, params:{} (HSN-02’s shape, the control)

`POST /orgs/1692/alphastudio/media/jobs` → **402** · request-id `05eb69ef-0f62-4174-ac0c-96b17685895e`
> sent ONLY because the wallet read 0 — the 402 shield

```json
{
  "request": {
    "capability": "social-posts.media",
    "plan": "balanced",
    "kind": "image",
    "posts": [
      {
        "ref": "hsn-0902-probe-draft",
        "content": "This lot landed Tuesday and we roasted it Thursday — that is the whole trick. Order this week’s roast.",
        "tone": {
          "id": "hsn-0902-probe-tone",
          "name": "Roastery floor",
          "description": "Warm, specific, smells of coffee.",
          "rules": [
            {
              "kind": "do",
              "text": "Name the roast date"
            }
          ]
        }
      }
    ],
    "style": {
      "imgStyle": "Cinematic",
      "text": true,
      "logo": true
    },
    "guidance": [],
    "collection": {
      "use": true
    },
    "params": {}
  },
  "response": {
    "error": {
      "code": "wallet_insufficient",
      "message": "The org's wallet cannot cover this request — not enough credits",
      "requestId": "05eb69ef-0f62-4174-ac0c-96b17685895e"
    }
  }
}
```

#### P2 · wallet — after the five refused bodies

`GET /orgs/1692/alphastudio/wallet` → **200** · request-id `5b496eea-d7d3-4b4f-ad24-0782d1812ee8`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

#### P2 · media/jobs — list after (no job may exist)

`GET /orgs/1692/alphastudio/media/jobs` → **200** · request-id `78bfb670-b6db-4f4f-ab8e-51aa2137685f`

```json
{
  "jobs": []
}
```

#### P3 · GET /orgs/:id — the org record before any write

`GET /orgs/1692` → **200** · request-id `b2a39864-2699-4da5-9358-ae5c7165f039`

```json
{
  "org": {
    "id": "1692",
    "name": "QA HSN-0902 Org 1788350803187",
    "slug": "qa-hsn-0902-org-1788350803187",
    "status": "active",
    "createdAt": "2026-09-02T12:06:47.431Z",
    "updatedAt": "2026-09-02T12:06:47.431Z",
    "country": null
  },
  "membership": {
    "id": "1934",
    "orgId": "1692",
    "userId": "2070",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-02T12:06:47.431Z",
    "updatedAt": "2026-09-02T12:06:47.431Z"
  }
}
```

#### P3a · PATCH /orgs/:id — the two fields ALONE

`PATCH /orgs/1692` → **400** · request-id `e253b332-f190-4188-b0e4-39e660023c17`

```json
{
  "request": {
    "whatYouOffer": "Specialty coffee, roasted to order and shipped within 48 hours.",
    "whatSetsYouApart": "Roasted to order. Direct-trade sourcing. Carbon-neutral shipping."
  },
  "response": {
    "error": {
      "code": "validation_failed",
      "message": "Validation failed",
      "details": [
        {
          "field": "(root)",
          "message": "Provide at least one field to update"
        }
      ],
      "requestId": "e253b332-f190-4188-b0e4-39e660023c17"
    }
  }
}
```

#### P3a · GET /orgs/:id — read back

`GET /orgs/1692` → **200** · request-id `93ae8699-ca3c-4870-9eed-4d1fac015e60`

```json
{
  "org": {
    "id": "1692",
    "name": "QA HSN-0902 Org 1788350803187",
    "slug": "qa-hsn-0902-org-1788350803187",
    "status": "active",
    "createdAt": "2026-09-02T12:06:47.431Z",
    "updatedAt": "2026-09-02T12:06:47.431Z",
    "country": null
  },
  "membership": {
    "id": "1934",
    "orgId": "1692",
    "userId": "2070",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-02T12:06:47.431Z",
    "updatedAt": "2026-09-02T12:06:47.431Z"
  }
}
```

#### P3b · PATCH /orgs/:id — the two fields beside `name`

`PATCH /orgs/1692` → **200** · request-id `56022204-f83e-4c3b-8249-64af8853c189`

```json
{
  "request": {
    "name": "QA HSN-0902 Org 1788350803187",
    "whatYouOffer": "Specialty coffee, roasted to order and shipped within 48 hours.",
    "whatSetsYouApart": "Roasted to order. Direct-trade sourcing. Carbon-neutral shipping."
  },
  "response": {
    "id": "1692",
    "name": "QA HSN-0902 Org 1788350803187",
    "slug": "qa-hsn-0902-org-1788350803187",
    "status": "active",
    "createdAt": "2026-09-02T12:06:47.431Z",
    "updatedAt": "2026-09-02T12:07:06.576Z",
    "country": null
  }
}
```

#### P3b · GET /orgs/:id — read back

`GET /orgs/1692` → **200** · request-id `45071929-6238-49f7-84dc-598658e40e03`

```json
{
  "org": {
    "id": "1692",
    "name": "QA HSN-0902 Org 1788350803187",
    "slug": "qa-hsn-0902-org-1788350803187",
    "status": "active",
    "createdAt": "2026-09-02T12:06:47.431Z",
    "updatedAt": "2026-09-02T12:07:06.576Z",
    "country": null
  },
  "membership": {
    "id": "1934",
    "orgId": "1692",
    "userId": "2070",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-02T12:06:47.431Z",
    "updatedAt": "2026-09-02T12:06:47.431Z"
  }
}
```

#### P3c · GET /orgs/:id/alphastudio/profile

`GET /orgs/1692/alphastudio/profile` → **404** · request-id `fa1aec74-790a-4bab-952d-ad75497e102e`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### P3c · GET /orgs/:id/alphastudio/org

`GET /orgs/1692/alphastudio/org` → **404** · request-id `5a13bde2-1e2e-4a8b-9bbc-1702fa40756f`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### P3c · GET /orgs/:id/alphastudio/organization

`GET /orgs/1692/alphastudio/organization` → **404** · request-id `d9a6e395-746c-4af2-aab7-8a58816051ce`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### P3c · GET /orgs/:id/alphastudio/brand

`GET /orgs/1692/alphastudio/brand` → **404** · request-id `fcff778b-d101-4c9d-a4e3-887dd4627104`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### P3c · GET /orgs/:id/alphastudio/context

`GET /orgs/1692/alphastudio/context` → **404** · request-id `a1a842dd-29bb-4360-a8e6-64d2d1d2bba5`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### P3c · GET /orgs/:id/profile

`GET /orgs/1692/profile` → **404** · request-id `54fb393f-047f-4ab6-aa8a-24f48c1db6b9`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### P3c · GET /orgs/:id/brand/profile

`GET /orgs/1692/brand/profile` → **404** · request-id `6ec1ed3c-280d-4366-8d91-1f3019d10741`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```



## HSN-0910 Phase 0 — the 13 capabilities, the approve door, State under Country, the environment (2026-09-10)

Captured by `pnpm probe:hsn-0910` against the deployed SANDBOX API on one fresh QA org —
**1824** (`qa+1789026912812hsn0910@alphapromena.com`) — org 619 untouched; the funded QA org read ONLY
(a job list, never a POST). Zero spend: catalog reads, five presigns with five free Node
PUTs, read-presigns, and every generation body sent ONLY behind the zero-wallet shield (a
valid body answers 402 at the wallet check, an invalid one 400 before it; the wallet and the
job list are re-read after). Bodies verbatim; presigned urls, the API base and every token
redacted. Request-ids are the server's `x-request-id` (or the envelope's `requestId`).
The durable raw copy is `Docs/qa/hsn-0910/phase0/` (this file is overwritten wholesale by
`pnpm smoke:alphastudio`). The catalog bodies are summarised here and verbatim there
(`catalog/<capability>.json`, `catalog/<capability>.plan-<plan>.json`). Run stamp: `2026-09-10T07:55:12.812Z`.

### Capability × catalog × 402 × 400 trap

| Capability | Catalog | Valid body (§3.2) | Traps (§3.3) |
| --- | --- | --- | --- |
| `media.generate` | 200 · selectable true · field "plan" · rows: image-balanced (balanced: images 0.03); image-reference (creative: images 0.06); image-reference-lite (balanced: images 0.05); image-reference-top (precise: images 0.211); image-super (creative: images 0.06); image-top (precise: images 0.211); video-reference-core (balanced: video_seconds 0.068); video-reference-plus (creative: video_seconds 0.14); video-reference-top (precise: video_seconds 0.28) · per plan: balanced = image-balanced (balanced: images 0.03); image-reference-lite (balanced: images 0.05); video-reference-core (balanced: video_seconds 0.068); creative = image-reference (creative: images 0.06); image-super (creative: images 0.06); video-reference-plus (creative: video_seconds 0.14); precise = image-reference-top (precise: images 0.211); image-top (precise: images 0.211); video-reference-top (precise: video_seconds 0.28) | document-example: **402** wallet_insufficient<br>with-origin: **402** wallet_insufficient | unknown-param-key: **400** bad_request (names field: no) |
| `images.edit` | 200 · selectable false · field null · rows: image-reference (creative: images 0.06) | document-example: **402** wallet_insufficient | two-referenceImages: **400** bad_request (names field: no) |
| `photoshoot.generate` | 200 · selectable false · field null · rows: image-reference (creative: images 0.06) | document-example: **402** wallet_insufficient<br>four-referenceImages: **402** wallet_insufficient | five-referenceImages: **502** bad_gateway (names field: no)<br>five-referenceImages-again: **502** bad_gateway (names field: no) |
| `brand-assets.generate` | 200 · selectable false · field null · rows: image-design (plan null: images 0.05) | document-example: **402** wallet_insufficient | count-1: **400** bad_request (names field: no) |
| `logos.generate` | 200 · selectable true · field "plan" · rows: image-balanced (balanced: images 0.03); image-reference (creative: images 0.06); image-reference-lite (balanced: images 0.05); image-reference-top (precise: images 0.211); image-super (creative: images 0.06); image-top (precise: images 0.211) · per plan: balanced = image-balanced (balanced: images 0.03); image-reference-lite (balanced: images 0.05); creative = image-reference (creative: images 0.06); image-super (creative: images 0.06); precise = image-reference-top (precise: images 0.211); image-top (precise: images 0.211) | document-example: **402** wallet_insufficient | count-21: **400** bad_request (names field: no) |
| `logos.redesign` | 200 · selectable true · field "plan" · rows: image-reference (creative: images 0.06); image-reference-lite (balanced: images 0.05); image-reference-top (precise: images 0.211) · per plan: balanced = image-reference-lite (balanced: images 0.05); creative = image-reference (creative: images 0.06); precise = image-reference-top (precise: images 0.211) | document-example: **402** wallet_insufficient | no-referenceImages: **400** bad_request (names field: no) |
| `avatars.generate` | 200 · selectable false · field null · rows: image-reference-top (precise: images 0.211) | document-example: **402** wallet_insufficient | count-9: **400** bad_request (names field: no) |
| `avatars.imagine` | 200 · selectable false · field null · rows: image-top (precise: images 0.211) | document-example: **402** wallet_insufficient | instruction-601-chars: **400** bad_request (names field: no) |
| `avatar.generate` | 200 · selectable true · field "plan" · rows: image-balanced-seedream (plan null: images 0.03); image-reference (creative: images 0.06); image-reference-seedream (plan null: images 0.03); image-reference-top (precise: images 0.211); image-super (creative: images 0.06); image-top (precise: images 0.211) · per plan: balanced = image-balanced-seedream (plan null: images 0.03); image-reference-seedream (plan null: images 0.03); creative = image-reference (creative: images 0.06); image-super (creative: images 0.06); precise = image-reference-top (precise: images 0.211); image-top (precise: images 0.211) | document-example: **402** wallet_insufficient | count-9: **400** bad_request (names field: no) |
| `video-ads.generate` | 200 · selectable true · field "plan" · rows: video-image-balanced (plan null: video_seconds 0.07); video-image-core (plan null: video_seconds 0.042); video-image-super (plan null: video_seconds 0.112) · per plan: balanced = video-image-core (plan null: video_seconds 0.042); creative = video-image-balanced (plan null: video_seconds 0.07); precise = video-image-super (plan null: video_seconds 0.112) | document-example: **402** wallet_insufficient | aspectRatio: **400** bad_request (names field: no)<br>generateAudio-true: **400** bad_request (names field: no)<br>durationS-8: **400** bad_request (names field: no) |
| `voice.speak` | 200 · selectable true · field "plan" · rows: voice-expressive (plan null: audio_text_units 0.1); voice-multilingual (plan null: audio_text_units 0.1); voice-turbo (plan null: audio_text_units 0.05) · per plan: balanced = voice-turbo (plan null: audio_text_units 0.05); creative = voice-multilingual (plan null: audio_text_units 0.1); precise = voice-expressive (plan null: audio_text_units 0.1) | document-example: **402** wallet_insufficient | unapproved-voice: **400** bad_request (names field: no)<br>similarity-on-precise: **400** bad_request (names field: no) |
| `film.generate` | 200 · selectable true · field "plan" · rows: video-scene-core (plan null: video_seconds 0.14); video-scene-plus (plan null: video_seconds 0.3034, video_seconds_by_resolution {"4k":"2.7306","480p":"0.1415","720p":"0.3034","1080p":"0.6827"}); video-scene-top (plan null: video_seconds 0.473, video_seconds_by_resolution {"480p":"0.2205","720p":"0.473","1080p":"1.0643"}) · per plan: balanced = video-scene-core (plan null: video_seconds 0.14); creative = video-scene-plus (plan null: video_seconds 0.3034, video_seconds_by_resolution {"4k":"2.7306","480p":"0.1415","720p":"0.3034","1080p":"0.6827"}); precise = video-scene-top (plan null: video_seconds 0.473, video_seconds_by_resolution {"480p":"0.2205","720p":"0.473","1080p":"1.0643"}) | document-example: **402** wallet_insufficient<br>with-references-and-character: **402** wallet_insufficient | resolution-on-balanced: **400** bad_request (names field: no)<br>talking-on-balanced: **400** bad_request (names field: no)<br>scenes-do-not-sum: **400** bad_request (names field: no) |
| `motion.generate` | 200 · selectable true · field "plan" · rows: video-motion-core (plan null: video_seconds 0.07); video-motion-plus (plan null: video_seconds 0.112); video-motion-top (plan null: video_seconds 0.126) · per plan: balanced = video-motion-core (plan null: video_seconds 0.07); creative = video-motion-plus (plan null: video_seconds 0.112); precise = video-motion-top (plan null: video_seconds 0.126) | document-example: **400** bad_request<br>ladder-1x1-still-5s-clip: **400** bad_request<br>ladder-512-still-3s-clip: **400** bad_request<br>ladder-1x1-still-3s-clip: **400** bad_request<br>ladder-required-keys-only: **402** wallet_insufficient<br>ladder-plus-keepSound-prompt: **402** wallet_insufficient<br>ladder-plus-lang-ar: **400** bad_request<br>ladder-orientation-video: **400** bad_request | no-orientation: **400** bad_request (names field: no) |

### What this run established

- §3.8 /health: 200 {"ok":true}; header names [connection, content-length, content-type, date, x-amzn-requestid, x-amzn-trace-id, x-request-id].
- §3.8 /openapi: 200; info={"title":"AlphaStudio API","description":"Conventions (match the implementation exactly):\n- Success responses are bare resource JSON (no envelope). Lists are `{ items, total }`.\n- Errors are `{ error: { code, message, details?, requestId? } }`; `code` is machine-readable and part of the contract.\n- IDs are Postgres bigints serialized as decimal strings.\n- Timestamps are ISO 8601.\n- Every response carries `x-request-id` (echoes an inbound one).\n- Auth is `Authorization: Bearer <opaque session token>`.","version":"0.1.0"}; servers=undefined; environment-like top-level keys: none.
- §3.8 https://malaky.ai: html 200; bundles [none]; NOT A VITE BUILD — no /assets/*.js; script hosts [img1.wsimg.com].
- §3.8 https://1.malaky.ai: html 200; bundles [index-DUHITzRc.js]; LIVE (the API host is inlined in index-DUHITzRc.js).
- §3.8 https://alphabeacon-web.vercel.app: html 0; bundles [none]; UNREACHABLE from this host (transport error — not measured here).
- Fresh QA org: id 1824 ("QA HSN-0910 Org 1789026912812"); org record keys [id, name, slug, status, createdAt, updatedAt, country].
- §3.8 org root keys [org, membership]; org keys [id, name, slug, status, createdAt, updatedAt, country] — no environment-like key.
- Wallet on the fresh org: 200 {"cents":0,"heldCents":0,"availableCents":0}.
- asset A (image/png): presign 201 → masset_b24afbaa6bcb30f68af48c8e; PUT 200.
- asset B (image/png): presign 201 → masset_392d87c15f41bfe946854a38; PUT 200.
- 3 s MP4 source: ffmpeg lavfi colour source, 3 s, 64×64, 2384 bytes.
- asset V (video/mp4): presign 201 → masset_8ea12cc8634160529ee6834c; PUT 200.
- 512 px PNG source: ffmpeg lavfi colour source, 512×512, 1900 bytes.
- asset C (image/png): presign 201 → masset_1508fa6f5391e767f91d2df2; PUT 200.
- 5 s MP4 source: ffmpeg lavfi colour source, 5 s, 64×64, 2914 bytes.
- asset W (video/mp4): presign 201 → masset_f8737222c97ea8030669bb3b; PUT 200.
- Read urls: A minted, B minted; video assets V masset_8ea12cc8634160529ee6834c, W masset_f8737222c97ea8030669bb3b; still C masset_1508fa6f5391e767f91d2df2.
- §3.1 media.generate: 200 · selectable=true · field="plan" · models: image-balanced [balanced, image, cost {"images":"0.03"}] · image-reference [creative, image, cost {"images":"0.06"}] · image-reference-lite [balanced, image, cost {"images":"0.05"}] · image-reference-top [precise, image, cost {"images":"0.211"}] · image-super [creative, image, cost {"images":"0.06"}] · image-top [precise, image, cost {"images":"0.211"}] · video-reference-core [balanced, video, cost {"video_seconds":"0.068"}] · video-reference-plus [creative, video, cost {"video_seconds":"0.14"}] · video-reference-top [precise, video, cost {"video_seconds":"0.28"}].
- §3.1 images.edit: 200 · selectable=false · field=null · models: image-reference [creative, image, cost {"images":"0.06"}].
- §3.1 photoshoot.generate: 200 · selectable=false · field=null · models: image-reference [creative, image, cost {"images":"0.06"}].
- §3.1 brand-assets.generate: 200 · selectable=false · field=null · models: image-design [null, image, cost {"images":"0.05"}].
- §3.1 logos.generate: 200 · selectable=true · field="plan" · models: image-balanced [balanced, image, cost {"images":"0.03"}] · image-reference [creative, image, cost {"images":"0.06"}] · image-reference-lite [balanced, image, cost {"images":"0.05"}] · image-reference-top [precise, image, cost {"images":"0.211"}] · image-super [creative, image, cost {"images":"0.06"}] · image-top [precise, image, cost {"images":"0.211"}].
- §3.1 logos.redesign: 200 · selectable=true · field="plan" · models: image-reference [creative, image, cost {"images":"0.06"}] · image-reference-lite [balanced, image, cost {"images":"0.05"}] · image-reference-top [precise, image, cost {"images":"0.211"}].
- §3.1 avatars.generate: 200 · selectable=false · field=null · models: image-reference-top [precise, image, cost {"images":"0.211"}].
- §3.1 avatars.imagine: 200 · selectable=false · field=null · models: image-top [precise, image, cost {"images":"0.211"}].
- §3.1 avatar.generate: 200 · selectable=true · field="plan" · models: image-balanced-seedream [null, image, cost {"images":"0.03"}] · image-reference [creative, image, cost {"images":"0.06"}] · image-reference-seedream [null, image, cost {"images":"0.03"}] · image-reference-top [precise, image, cost {"images":"0.211"}] · image-super [creative, image, cost {"images":"0.06"}] · image-top [precise, image, cost {"images":"0.211"}].
- §3.1 video-ads.generate: 200 · selectable=true · field="plan" · models: video-image-balanced [null, video, cost {"video_seconds":"0.07"}] · video-image-core [null, video, cost {"video_seconds":"0.042"}] · video-image-super [null, video, cost {"video_seconds":"0.112"}].
- §3.1 voice.speak: 200 · selectable=true · field="plan" · models: voice-expressive [null, audio, cost {"audio_text_units":"0.1"}] · voice-multilingual [null, audio, cost {"audio_text_units":"0.1"}] · voice-turbo [null, audio, cost {"audio_text_units":"0.05"}].
- §3.1 film.generate: 200 · selectable=true · field="plan" · models: video-scene-core [null, video, cost {"video_seconds":"0.14"}] · video-scene-plus [null, video, cost {"video_seconds":"0.3034","video_seconds_by_resolution":{"4k":"2.7306","480p":"0.1415","720p":"0.3034","1080p":"0.6827"}}] · video-scene-top [null, video, cost {"video_seconds":"0.473","video_seconds_by_resolution":{"480p":"0.2205","720p":"0.473","1080p":"1.0643"}}].
- §3.1 motion.generate: 200 · selectable=true · field="plan" · models: video-motion-core [null, video, cost {"video_seconds":"0.07"}] · video-motion-plus [null, video, cost {"video_seconds":"0.112"}] · video-motion-top [null, video, cost {"video_seconds":"0.126"}].
- §3.1 media.generate per plan: balanced → image-balanced {"images":"0.03"} | image-reference-lite {"images":"0.05"} | video-reference-core {"video_seconds":"0.068"} · creative → image-reference {"images":"0.06"} | image-super {"images":"0.06"} | video-reference-plus {"video_seconds":"0.14"} · precise → image-reference-top {"images":"0.211"} | image-top {"images":"0.211"} | video-reference-top {"video_seconds":"0.28"}.
- §3.1 logos.generate per plan: balanced → image-balanced {"images":"0.03"} | image-reference-lite {"images":"0.05"} · creative → image-reference {"images":"0.06"} | image-super {"images":"0.06"} · precise → image-reference-top {"images":"0.211"} | image-top {"images":"0.211"}.
- §3.1 logos.redesign per plan: balanced → image-reference-lite {"images":"0.05"} · creative → image-reference {"images":"0.06"} · precise → image-reference-top {"images":"0.211"}.
- §3.1 avatar.generate per plan: balanced → image-balanced-seedream {"images":"0.03"} | image-reference-seedream {"images":"0.03"} · creative → image-reference {"images":"0.06"} | image-super {"images":"0.06"} · precise → image-reference-top {"images":"0.211"} | image-top {"images":"0.211"}.
- §3.1 video-ads.generate per plan: balanced → video-image-core {"video_seconds":"0.042"} · creative → video-image-balanced {"video_seconds":"0.07"} · precise → video-image-super {"video_seconds":"0.112"}.
- §3.1 voice.speak?plan=balanced: 200; voice schema per model: [{"alias":"voice-turbo","voice":{"enum":["g3YpdjT1OTh9cunaumJs","Rachel"],"type":"string"},"lang":{"type":"string","pattern":"^[a-z]{2}$"},"appMetadata":{"min_plan":"pro"}}].
- §3.1 voice.speak?plan=creative: 200; voice schema per model: [{"alias":"voice-multilingual","voice":{"enum":["g3YpdjT1OTh9cunaumJs","Rachel"],"type":"string"},"lang":{"type":"string","pattern":"^[a-z]{2}$"},"appMetadata":{"min_plan":"pro"}}].
- §3.1 voice.speak?plan=precise: 200; voice schema per model: [{"alias":"voice-expressive","voice":{"enum":["g3YpdjT1OTh9cunaumJs","Rachel"],"type":"string"},"lang":{"type":"string","pattern":"^[a-z]{2}$"},"appMetadata":{"min_plan":"pro"}}].
- §3.1 voice.speak per plan: balanced → voice-turbo {"audio_text_units":"0.05"} · creative → voice-multilingual {"audio_text_units":"0.1"} · precise → voice-expressive {"audio_text_units":"0.1"}.
- §3.1 film.generate per plan: balanced → video-scene-core {"video_seconds":"0.14"} · creative → video-scene-plus {"video_seconds":"0.3034","video_seconds_by_resolution":{"4k":"2.7306","480p":"0.1415","720p":"0.3034","1080p":"0.6827"}} · precise → video-scene-top {"video_seconds":"0.473","video_seconds_by_resolution":{"480p":"0.2205","720p":"0.473","1080p":"1.0643"}}.
- §3.1 motion.generate per plan: balanced → video-motion-core {"video_seconds":"0.07"} · creative → video-motion-plus {"video_seconds":"0.112"} · precise → video-motion-top {"video_seconds":"0.126"}.
- §3.1 avatar.generate own models: 6 row(s) on the plain read [image-balanced-seedream/plan null, image-reference/creative, image-reference-seedream/plan null, image-reference-top/precise, image-super/creative, image-top/precise]; per plan balanced=image-balanced-seedream+image-reference-seedream, creative=image-reference+image-super, precise=image-reference-top+image-top.
- §3.1 film.generate own models: 3 row(s) on the plain read [video-scene-core/plan null, video-scene-plus/plan null, video-scene-top/plan null]; per plan balanced=video-scene-core, creative=video-scene-plus, precise=video-scene-top.
- §3.1 motion.generate own models: 3 row(s) on the plain read [video-motion-core/plan null, video-motion-plus/plan null, video-motion-top/plan null]; per plan balanced=video-motion-core, creative=video-motion-plus, precise=video-motion-top.
- §3.5 approve door: 404 not_found — NOT proxied by Ward.
- §3.2 media.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 images.edit · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 photoshoot.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 brand-assets.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 logos.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 logos.redesign · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 avatars.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 avatars.imagine · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 avatar.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 video-ads.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 voice.speak · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 film.generate · document-example: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 motion.generate · document-example: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema".
- §3.2 media.generate · with-origin: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 film.generate · with-references-and-character: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 photoshoot.generate · four-referenceImages: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 motion.generate · ladder-1x1-still-5s-clip: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema".
- §3.2 motion.generate · ladder-512-still-3s-clip: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema".
- §3.2 motion.generate · ladder-1x1-still-3s-clip: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema".
- §3.2 motion.generate · ladder-required-keys-only: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 motion.generate · ladder-plus-keepSound-prompt: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- §3.2 motion.generate · ladder-plus-lang-ar: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema".
- §3.2 motion.generate · ladder-orientation-video: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema".
- §3.3 images.edit · two-referenceImages: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 photoshoot.generate · five-referenceImages: 502 code=bad_gateway "The media service is unavailable — try again later" · names the field? no.
- §3.3 photoshoot.generate · five-referenceImages-again: 502 code=bad_gateway "The media service is unavailable — try again later" · names the field? no.
- §3.3 brand-assets.generate · count-1: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 logos.generate · count-21: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 logos.redesign · no-referenceImages: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 avatars.generate · count-9: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 avatars.imagine · instruction-601-chars: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 avatar.generate · count-9: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 video-ads.generate · aspectRatio: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 video-ads.generate · generateAudio-true: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 video-ads.generate · durationS-8: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 voice.speak · unapproved-voice: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 voice.speak · similarity-on-precise: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 film.generate · resolution-on-balanced: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 film.generate · talking-on-balanced: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 film.generate · scenes-do-not-sum: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 motion.generate · no-orientation: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- §3.3 media.generate · unknown-param-key: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema" · names the field? no.
- After the bodies: wallet {"cents":0,"heldCents":0,"availableCents":0}; jobs listed: 0.
- §3.7a countries: 200; total=249; row keys across the list [code, name]; US row {"code":"US","name":"United States"}; NO state-like key on any row.
- §3.7b PUT country with state: 200; holidaysCount=10 reloaded=true; org keys [id, name, slug, status, createdAt, updatedAt, country]; state DROPPED (not on the org record).
- §3.7b org after: country="US"; keys [id, name, slug, status, createdAt, updatedAt, country]; no `state` key.
- §3.7d holidays: 200; total=10; row keys [id, orgId, date, event, rules, createdAt, processed]; first {"id":"864","orgId":"1824","date":"2026-10-12","event":"Columbus Day","rules":[{"kind":"do","text":"Acknowledge the federal holiday and the growing recognition of Indigenous Peoples' Day alongside it, reflecting the dual conversation many Americans are having."},{"kind":"dont","text":"Don't frame it as a straightforward celebration of exploration — the contested history means a one-sided tone will alienate a significant portion of your audience."}],"createdAt":"2026-09-10T07:57:13.226Z","processed":false}.
- §3.7c event-source with state: 201; row keys [id, orgId, kind, country, createdAt, updatedAt]; state DROPPED.
- §3.7 state-list sweep (read-only): /orgs/:id/event-sources/countries/US → 404 · /orgs/:id/event-sources/countries/US/states → 404 · /orgs/:id/event-sources/states?country=US → 400 · /orgs/:id/event-sources/subdivisions?country=US → 400 · /orgs/:id/countries/US/states → 404 · /orgs/:id/states?country=US → 404.
- §3.4 funded org 1813: 0 job(s) listed []; multi-kind or audio/document jobs: 0.
- §3.4 UNMEASURED: no multi-asset job exists on the funded org — the gallery renders `audio`/`document` kinds defensively (row + Open, no player claims).
- cleanup masset_b24afbaa6bcb30f68af48c8e (image/png): 204.
- cleanup masset_392d87c15f41bfe946854a38 (image/png): 204.
- cleanup masset_8ea12cc8634160529ee6834c (video/mp4): 204.
- cleanup masset_1508fa6f5391e767f91d2df2 (image/png): 204.
- cleanup masset_f8737222c97ea8030669bb3b (video/mp4): 204.
- cleanup list re-read: 200 {"assets":[]}.

### Captured exchanges, in order (catalog bodies summarised — raw in `Docs/qa/hsn-0910/phase0/catalog/`)

#### 1. §3.8 · GET /health — the liveness body and its headers

`GET /health` → **200** · request-id `0f7a4173-1334-4d45-81b8-b51862e6ca44` · 1140 ms · raw `environment/health.json`

```json
{
  "connection": "keep-alive",
  "content-length": "11",
  "content-type": "application/json",
  "date": "Thu, 10 Sep 2026 07:55:13 GMT",
  "x-amzn-requestid": "4aa555f6-19fb-4f71-a3a8-b3578bdf4069",
  "x-amzn-trace-id": "Root=1-6aa26260-230d64910ba642c77bd30759;Parent=3605f0d96eab1e60;Sampled=0;Lineage=1:b360ccf9:0",
  "x-request-id": "0f7a4173-1334-4d45-81b8-b51862e6ca44"
}
```

```json
{
  "ok": true
}
```

#### 2. §3.8 · GET /openapi — top-level keys, info, servers

`GET /openapi` → **200** · request-id `598e4fdd-61a8-49f7-94d5-9ea63b49a81d` · 671 ms · raw `environment/openapi.json`

```json
{
  "status": 200,
  "requestId": "598e4fdd-61a8-49f7-94d5-9ea63b49a81d",
  "keys": [
    "openapi",
    "info",
    "components",
    "paths"
  ],
  "info": {
    "title": "AlphaStudio API",
    "description": "Conventions (match the implementation exactly):\n- Success responses are bare resource JSON (no envelope). Lists are `{ items, total }`.\n- Errors are `{ error: { code, message, details?, requestId? } }`; `code` is machine-readable and part of the contract.\n- IDs are Postgres bigints serialized as decimal strings.\n- Timestamps are ISO 8601.\n- Every response carries `x-request-id` (echoes an inbound one).\n- Auth is `Authorization: Bearer <opaque session token>`.",
    "version": "0.1.0"
  },
  "envLikeKeys": []
}
```

#### 3. §3.8 · GET https://malaky.ai/ — the entry html

`GET <redacted url: 18 chars>` → **200** · request-id `none` · 265 ms

```json
{
  "cache-control": "max-age=30",
  "connection": "keep-alive",
  "content-encoding": "br",
  "content-length": "15336",
  "content-security-policy": "frame-ancestors 'self' godaddy.com *.godaddy.com dev-godaddy.com *.dev-godaddy.com test-godaddy.com *.test-godaddy.com",
  "content-type": "text/html;charset=utf-8",
  "date": "Thu, 10 Sep 2026 07:55:14 GMT",
  "etag": "125a93258a20b104faaec8c3eae8525d",
  "keep-alive": "timeout=5",
  "link": "<//img1.wsimg.com/ceph-p3-01/website-builder-data-prod/static/widgets/UX.4.51.22.js>; rel=preload; as=script; crossorigin,<https://img1.wsimg.com/gfonts/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2>; rel=preload; as=font; crossorigin,<https://img1.wsimg.com/gfonts/s/sourcesanspro/v23/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZZMkids18Q.woff2>; rel=preload; as=font; crossorigin,<https://img1.wsimg.com/gfonts/s/sourcesanspro/v23/6xK1dSBYKcSV-LCoeQqfX1RYOo3qPZ7nsDI.woff2>; rel=preload; as=font; crossorigin,<https://img1.wsimg.com/gfonts/s/sourcesanspro/v23/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZZclSds18Q.woff2>; rel=preload; as=font; crossorigin,<https://img1.wsimg.com/gfonts/s/sourcesanspro/v23/6xKydSBYKcSV-LCoeQqfX1RYOo3ik4zwlxdu.woff2>; rel=preload; as=font; crossorigin,<https://img1.wsimg.com/gfonts/s/sourcesanspro/v23/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7l.woff2>; rel=preload; as=font; crossorigin,<https://img1.wsimg.com/gfonts/s/sourcesanspro/v23/6xKydSBYKcSV-LCoeQqfX1RYOo3ig4vwlxdu.woff2>; rel=preload; as=font; crossorigin,<https://img1.wsimg.com/gfonts/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2>; rel=preload; as=font; crossorigin,<https://fonts.googleapis.com>; rel=preconnect; crossorigin,<https://fonts.gstatic.com>; rel=preconnect; crossorigin,<https://img1.wsimg.com>; rel=preconnect; crossorigin,<https://isteam.wsimg.com>; rel=preconnect; crossorigin",
  "server": "DPS/2.0.0+sha-9ac0622",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "vary": "Accept-Encoding",
  "x-siteid": "ap-south-1",
  "x-version": "9ac0622"
}
```

```json
{
  "origin": "<redacted url: 17 chars>",
  "htmlStatus": 200,
  "bundles": [],
  "scriptHosts": [
    "img1.wsimg.com"
  ],
  "mode": "NOT A VITE BUILD — no /assets/*.js; script hosts [img1.wsimg.com]"
}
```

#### 4. §3.8 · GET https://1.malaky.ai/ — the entry html

`GET <redacted url: 20 chars>` → **200** · request-id `none` · 317 ms

```json
{
  "access-control-allow-origin": "*",
  "age": "504",
  "cache-control": "public, max-age=0, must-revalidate",
  "content-disposition": "inline",
  "content-encoding": "br",
  "content-type": "text/html; charset=utf-8",
  "date": "Thu, 10 Sep 2026 07:55:15 GMT",
  "etag": "W/\"c4aeade946ddad0eca4d45e38ea93616\"",
  "last-modified": "Thu, 10 Sep 2026 07:46:50 GMT",
  "server": "Vercel",
  "strict-transport-security": "max-age=63072000",
  "transfer-encoding": "chunked",
  "x-vercel-cache": "HIT",
  "x-vercel-id": "bom1::tp9l7-1789026915055-05e2daba6a3b"
}
```

```json
{
  "origin": "<redacted url: 19 chars>",
  "htmlStatus": 200,
  "bundles": [
    "index-DUHITzRc.js"
  ],
  "scriptHosts": [],
  "mode": "LIVE (the API host is inlined in index-DUHITzRc.js)",
  "vercelId": "bom1::tp9l7-1789026915055-05e2daba6a3b",
  "cacheHeader": "HIT"
}
```

#### 5. §3.8 · GET https://1.malaky.ai/assets/index-DUHITzRc.js — a bundle

`GET <redacted url: 44 chars>` → **200** · request-id `none` · 176 ms

```json
{
  "textPreview": "",
  "length": 683225
}
```

#### 6. §3.8 · GET https://alphabeacon-web.vercel.app/ — the entry html

`GET <redacted url: 35 chars>` → **0** · request-id `none` · 62 ms

```json
{}
```

```json
{
  "origin": "<redacted url: 34 chars>",
  "htmlStatus": 0,
  "bundles": [],
  "scriptHosts": [],
  "mode": "UNREACHABLE from this host (transport error — not measured here)",
  "transport": {
    "transportError": "TypeError: fetch failed"
  }
}
```

#### 7. create org

`POST /orgs` → **201** · request-id `b9cc78ba-583e-4e08-b627-01c6b69693e7` · 739 ms · raw `setup/create-org.json`
> the fresh QA org every probe below runs on

```json
{
  "request": {
    "name": "QA HSN-0910 Org 1789026912812"
  }
}
```

```json
{
  "org": {
    "id": "1824",
    "name": "QA HSN-0910 Org 1789026912812",
    "slug": "qa-hsn-0910-org-1789026912812",
    "status": "active",
    "createdAt": "2026-09-10T07:55:21.368Z",
    "updatedAt": "2026-09-10T07:55:21.368Z",
    "country": null
  },
  "membership": {
    "id": "2083",
    "orgId": "1824",
    "userId": "2210",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-10T07:55:21.368Z",
    "updatedAt": "2026-09-10T07:55:21.368Z"
  }
}
```

#### 8. §3.8 · GET /orgs/:id — the org root (an environment name anywhere?)

`GET /orgs/:id` → **200** · request-id `696b88ff-3205-49ff-9b0d-073f9daa3f0a` · 448 ms · raw `environment/org-root.json`

```json
{
  "org": {
    "id": "1824",
    "name": "QA HSN-0910 Org 1789026912812",
    "slug": "qa-hsn-0910-org-1789026912812",
    "status": "active",
    "createdAt": "2026-09-10T07:55:21.368Z",
    "updatedAt": "2026-09-10T07:55:21.368Z",
    "country": null
  },
  "membership": {
    "id": "2083",
    "orgId": "1824",
    "userId": "2210",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-10T07:55:21.368Z",
    "updatedAt": "2026-09-10T07:55:21.368Z"
  }
}
```

#### 9. wallet — the fresh org (the 402 shield)

`GET /orgs/:id/alphastudio/wallet` → **200** · request-id `703cf37f-d615-445a-8ac4-2337a6e37252` · 3354 ms · raw `setup/wallet-before.json`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

#### 10. asset A · media/assets/presign — image/png

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `2ce1216b-570f-44ab-a5d3-fd60cca41fa0` · 650 ms · raw `setup/presign-A.json`

```json
{
  "request": {
    "mediaType": "image/png",
    "desc": "HSN-0910 Phase 0 probe — reference image A"
  }
}
```

```json
{
  "assetId": "masset_b24afbaa6bcb30f68af48c8e",
  "uploadUrl": "<redacted url: 1661 chars>",
  "expiresAt": "2026-09-10T08:10:26.204Z",
  "mediaType": "image/png"
}
```

#### 11. asset A · PUT 70 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 581 ms

#### 12. asset B · media/assets/presign — image/png

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `bce19b13-6533-4d97-ad4d-90886dda5be3` · 911 ms · raw `setup/presign-B.json`

```json
{
  "request": {
    "mediaType": "image/png",
    "desc": "HSN-0910 Phase 0 probe — reference image B"
  }
}
```

```json
{
  "assetId": "masset_392d87c15f41bfe946854a38",
  "uploadUrl": "<redacted url: 1661 chars>",
  "expiresAt": "2026-09-10T08:10:27.702Z",
  "mediaType": "image/png"
}
```

#### 13. asset B · PUT 70 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 162 ms

#### 14. asset V · media/assets/presign — video/mp4

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `302ada6a-8d8d-424a-97c2-4f5c99d16eb3` · 748 ms · raw `setup/presign-V.json`

```json
{
  "request": {
    "mediaType": "video/mp4",
    "desc": "HSN-0910 Phase 0 probe — a 3-second motion clip"
  }
}
```

```json
{
  "assetId": "masset_8ea12cc8634160529ee6834c",
  "uploadUrl": "<redacted url: 1661 chars>",
  "expiresAt": "2026-09-10T08:10:28.665Z",
  "mediaType": "video/mp4"
}
```

#### 15. asset V · PUT 2384 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 164 ms

#### 16. asset C · media/assets/presign — image/png

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `8a7abaae-98b7-4efd-b247-a03eacc48dbc` · 2430 ms · raw `setup/presign-C.json`

```json
{
  "request": {
    "mediaType": "image/png",
    "desc": "HSN-0910 Phase 0 probe — a 512×512 motion still (the document’s 340 px floor honoured)"
  }
}
```

```json
{
  "assetId": "masset_1508fa6f5391e767f91d2df2",
  "uploadUrl": "<redacted url: 1661 chars>",
  "expiresAt": "2026-09-10T08:10:31.326Z",
  "mediaType": "image/png"
}
```

#### 17. asset C · PUT 1900 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 167 ms

#### 18. asset W · media/assets/presign — video/mp4

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `c0201380-2902-4a95-a11b-4589d185a615` · 1433 ms · raw `setup/presign-W.json`

```json
{
  "request": {
    "mediaType": "video/mp4",
    "desc": "HSN-0910 Phase 0 probe — a 5-second motion clip (inside the document’s 3–30 s)"
  }
}
```

```json
{
  "assetId": "masset_f8737222c97ea8030669bb3b",
  "uploadUrl": "<redacted url: 1661 chars>",
  "expiresAt": "2026-09-10T08:10:32.979Z",
  "mediaType": "video/mp4"
}
```

#### 19. asset W · PUT 2914 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 165 ms

#### 20. asset A · media/assets/:id/presign — the read url

`POST /orgs/:id/alphastudio/media/assets/masset_b24afbaa6bcb30f68af48c8e/presign` → **200** · request-id `2b0804e9-db7b-454a-bb8e-71bc4329a1ac` · 774 ms · raw `setup/read-presign-A.json`

```json
{
  "assetId": "masset_b24afbaa6bcb30f68af48c8e",
  "url": "<redacted url: 1621 chars>",
  "expiresAt": "2026-09-10T08:55:33.918Z"
}
```

#### 21. asset B · media/assets/:id/presign — the read url

`POST /orgs/:id/alphastudio/media/assets/masset_392d87c15f41bfe946854a38/presign` → **200** · request-id `44d61dd6-c375-45cf-bc45-2c95b02fe547` · 880 ms · raw `setup/read-presign-B.json`

```json
{
  "assetId": "masset_392d87c15f41bfe946854a38",
  "url": "<redacted url: 1621 chars>",
  "expiresAt": "2026-09-10T08:55:34.800Z"
}
```

#### 22. §3.1 · catalog — media.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/media.generate` → **200** · request-id `17fd5d47-7130-486f-a38e-ca4ee4e4484d` · 656 ms · raw `catalog/media.generate.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.05"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat"
      ]
    },
    {
      "alias": "video-reference-core",
      "kind": "video",
      "plan": "balanced",
      "cost": {
        "video_seconds": "0.068"
      },
      "schemaKeys": [
        "audio",
        "durationS",
        "resolution",
        "aspectRatio",
        "referenceImages"
      ]
    },
    {
      "alias": "video-reference-plus",
      "kind": "video",
      "plan": "creative",
      "cost": {
        "video_seconds": "0.14"
      },
      "schemaKeys": [
        "audio",
        "durationS",
        "resolution",
        "aspectRatio",
        "referenceImages"
      ]
    },
    {
      "alias": "video-reference-top",
      "kind": "video",
      "plan": "precise",
      "cost": {
        "video_seconds": "0.28"
      },
      "schemaKeys": [
        "audio",
        "durationS",
        "resolution",
        "aspectRatio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 23. §3.1 · catalog — images.edit

`GET /orgs/:id/alphastudio/catalog/capabilities/images.edit` → **200** · request-id `359f770b-3a99-4dc2-ab65-7c2b696695dc` · 757 ms · raw `catalog/images.edit.json`

```json
{
  "summarised": true,
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    }
  ]
}
```

#### 24. §3.1 · catalog — photoshoot.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/photoshoot.generate` → **200** · request-id `9ca26c16-8a11-4782-85e8-6f5304fe5e3c` · 748 ms · raw `catalog/photoshoot.generate.json`

```json
{
  "summarised": true,
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    }
  ]
}
```

#### 25. §3.1 · catalog — brand-assets.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/brand-assets.generate` → **200** · request-id `1d2d737a-e8f4-4e60-9bab-1f48cf3bea7b` · 2327 ms · raw `catalog/brand-assets.generate.json`

```json
{
  "summarised": true,
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-design",
      "kind": "image",
      "plan": null,
      "cost": {
        "images": "0.05"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    }
  ]
}
```

#### 26. §3.1 · catalog — logos.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.generate` → **200** · request-id `a8399996-a162-449d-8f4b-094ce2183fc6` · 612 ms · raw `catalog/logos.generate.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.05"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat"
      ]
    }
  ]
}
```

#### 27. §3.1 · catalog — logos.redesign

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.redesign` → **200** · request-id `7e22d499-a17e-4b90-8bf5-d3b5672a097b` · 756 ms · raw `catalog/logos.redesign.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.05"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    }
  ]
}
```

#### 28. §3.1 · catalog — avatars.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/avatars.generate` → **200** · request-id `2bd8e82f-2a70-4e67-89a5-282d31995610` · 768 ms · raw `catalog/avatars.generate.json`

```json
{
  "summarised": true,
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    }
  ]
}
```

#### 29. §3.1 · catalog — avatars.imagine

`GET /orgs/:id/alphastudio/catalog/capabilities/avatars.imagine` → **200** · request-id `8f048013-c296-4810-8b2c-a89b7a3a963e` · 760 ms · raw `catalog/avatars.imagine.json`

```json
{
  "summarised": true,
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat"
      ]
    }
  ]
}
```

#### 30. §3.1 · catalog — avatar.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/avatar.generate` → **200** · request-id `e6e4c3f4-27e9-4405-a57a-419e2bf113e2` · 754 ms · raw `catalog/avatar.generate.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced-seedream",
      "kind": "image",
      "plan": null,
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio"
      ]
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-seedream",
      "kind": "image",
      "plan": null,
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "referenceImages"
      ]
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat"
      ]
    }
  ]
}
```

#### 31. §3.1 · catalog — video-ads.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/video-ads.generate` → **200** · request-id `85455614-bcf6-4a1a-a521-fb63b5be84a5` · 757 ms · raw `catalog/video-ads.generate.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.07"
      },
      "schemaKeys": [
        "seed",
        "imageUrl",
        "durationS",
        "negativePrompt"
      ]
    },
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.042"
      },
      "schemaKeys": [
        "seed",
        "imageUrl",
        "durationS",
        "negativePrompt"
      ]
    },
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.112"
      },
      "schemaKeys": [
        "seed",
        "imageUrl",
        "durationS",
        "negativePrompt"
      ]
    }
  ]
}
```

#### 32. §3.1 · catalog — voice.speak

`GET /orgs/:id/alphastudio/catalog/capabilities/voice.speak` → **200** · request-id `779626f7-a5f8-41ef-acc6-08523c19ebff` · 758 ms · raw `catalog/voice.speak.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "voice-expressive",
      "kind": "audio",
      "plan": null,
      "cost": {
        "audio_text_units": "0.1"
      },
      "schemaKeys": [
        "lang",
        "voice",
        "stability"
      ]
    },
    {
      "alias": "voice-multilingual",
      "kind": "audio",
      "plan": null,
      "cost": {
        "audio_text_units": "0.1"
      },
      "schemaKeys": [
        "lang",
        "speed",
        "voice",
        "stability",
        "similarity"
      ]
    },
    {
      "alias": "voice-turbo",
      "kind": "audio",
      "plan": null,
      "cost": {
        "audio_text_units": "0.05"
      },
      "schemaKeys": [
        "lang",
        "speed",
        "voice",
        "stability",
        "similarity"
      ]
    }
  ]
}
```

#### 33. §3.1 · catalog — film.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/film.generate` → **200** · request-id `ce3fb74d-0a79-4811-aa17-3f5da1ae2dc8` · 766 ms · raw `catalog/film.generate.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "video-scene-core",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.14"
      },
      "schemaKeys": [
        "shots",
        "durationS",
        "aspectRatio",
        "generateAudio",
        "referenceImages"
      ]
    },
    {
      "alias": "video-scene-plus",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.3034",
        "video_seconds_by_resolution": {
          "4k": "2.7306",
          "480p": "0.1415",
          "720p": "0.3034",
          "1080p": "0.6827"
        }
      },
      "schemaKeys": [
        "audioUrl",
        "durationS",
        "resolution",
        "aspectRatio",
        "generateAudio",
        "referenceImages"
      ]
    },
    {
      "alias": "video-scene-top",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.473",
        "video_seconds_by_resolution": {
          "480p": "0.2205",
          "720p": "0.473",
          "1080p": "1.0643"
        }
      },
      "schemaKeys": [
        "audioUrl",
        "durationS",
        "resolution",
        "aspectRatio",
        "generateAudio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 34. §3.1 · catalog — motion.generate

`GET /orgs/:id/alphastudio/catalog/capabilities/motion.generate` → **200** · request-id `e2fe6044-0ecf-4211-8960-14c24e19b937` · 757 ms · raw `catalog/motion.generate.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "video-motion-core",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.07"
      },
      "schemaKeys": [
        "imageUrl",
        "videoUrl",
        "keepSound",
        "orientation"
      ]
    },
    {
      "alias": "video-motion-plus",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.112"
      },
      "schemaKeys": [
        "imageUrl",
        "videoUrl",
        "keepSound",
        "orientation"
      ]
    },
    {
      "alias": "video-motion-top",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.126"
      },
      "schemaKeys": [
        "imageUrl",
        "videoUrl",
        "keepSound",
        "orientation"
      ]
    }
  ]
}
```

#### 35. §3.1 · catalog — media.generate?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/media.generate?plan=balanced` → **200** · request-id `93d0f5d3-fc80-4a45-b6cf-4925031a9229` · 789 ms · raw `catalog/media.generate.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.05"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "video-reference-core",
      "kind": "video",
      "plan": "balanced",
      "cost": {
        "video_seconds": "0.068"
      },
      "schemaKeys": [
        "audio",
        "durationS",
        "resolution",
        "aspectRatio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 36. §3.1 · catalog — media.generate?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/media.generate?plan=creative` → **200** · request-id `13ac2655-e602-4b74-8f5d-22cabb110d4f` · 613 ms · raw `catalog/media.generate.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "video-reference-plus",
      "kind": "video",
      "plan": "creative",
      "cost": {
        "video_seconds": "0.14"
      },
      "schemaKeys": [
        "audio",
        "durationS",
        "resolution",
        "aspectRatio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 37. §3.1 · catalog — media.generate?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/media.generate?plan=precise` → **200** · request-id `6120ef54-2a34-4a17-b76a-4fdcd51e6190` · 755 ms · raw `catalog/media.generate.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat"
      ]
    },
    {
      "alias": "video-reference-top",
      "kind": "video",
      "plan": "precise",
      "cost": {
        "video_seconds": "0.28"
      },
      "schemaKeys": [
        "audio",
        "durationS",
        "resolution",
        "aspectRatio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 38. §3.1 · catalog — logos.generate?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.generate?plan=balanced` → **200** · request-id `c8b6bd79-3ac1-40ac-ad2f-f21f0007fe11` · 745 ms · raw `catalog/logos.generate.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.05"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    }
  ]
}
```

#### 39. §3.1 · catalog — logos.generate?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.generate?plan=creative` → **200** · request-id `aa097611-483c-4ba7-9aa1-9c8830dcf5eb` · 744 ms · raw `catalog/logos.generate.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    }
  ]
}
```

#### 40. §3.1 · catalog — logos.generate?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.generate?plan=precise` → **200** · request-id `8386c7ea-86c0-4a1a-a75d-6019979e5f41` · 755 ms · raw `catalog/logos.generate.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat"
      ]
    }
  ]
}
```

#### 41. §3.1 · catalog — logos.redesign?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.redesign?plan=balanced` → **200** · request-id `024cc07a-78e4-4484-afe9-607e46de3629` · 750 ms · raw `catalog/logos.redesign.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "cost": {
        "images": "0.05"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    }
  ]
}
```

#### 42. §3.1 · catalog — logos.redesign?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.redesign?plan=creative` → **200** · request-id `e9652e28-f915-4544-892f-885c09ce9742` · 602 ms · raw `catalog/logos.redesign.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    }
  ]
}
```

#### 43. §3.1 · catalog — logos.redesign?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/logos.redesign?plan=precise` → **200** · request-id `dff70c5c-9c32-4272-94eb-43336327dee5` · 595 ms · raw `catalog/logos.redesign.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    }
  ]
}
```

#### 44. §3.1 · catalog — avatar.generate?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/avatar.generate?plan=balanced` → **200** · request-id `4615c7a5-de4b-43ef-8d9a-0972e1d56b34` · 782 ms · raw `catalog/avatar.generate.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "image-balanced-seedream",
      "kind": "image",
      "plan": null,
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio"
      ]
    },
    {
      "alias": "image-reference-seedream",
      "kind": "image",
      "plan": null,
      "cost": {
        "images": "0.03"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 45. §3.1 · catalog — avatar.generate?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/avatar.generate?plan=creative` → **200** · request-id `90f75ca3-56e3-40da-97e1-b86ef618c449` · 824 ms · raw `catalog/avatar.generate.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt",
        "referenceImages"
      ]
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "cost": {
        "images": "0.06"
      },
      "schemaKeys": [
        "seed",
        "count",
        "aspectRatio",
        "outputFormat",
        "negativePrompt"
      ]
    }
  ]
}
```

#### 46. §3.1 · catalog — avatar.generate?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/avatar.generate?plan=precise` → **200** · request-id `f839ed30-e4ca-4eb1-b271-4a1538d7bc7b` · 745 ms · raw `catalog/avatar.generate.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat",
        "referenceImages"
      ]
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "cost": {
        "images": "0.211"
      },
      "schemaKeys": [
        "count",
        "aspectRatio",
        "outputFormat"
      ]
    }
  ]
}
```

#### 47. §3.1 · catalog — video-ads.generate?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/video-ads.generate?plan=balanced` → **200** · request-id `4bb8ab1b-82c0-4184-aa78-74f9d4a8f5e0` · 603 ms · raw `catalog/video-ads.generate.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.042"
      },
      "schemaKeys": [
        "seed",
        "imageUrl",
        "durationS",
        "negativePrompt"
      ]
    }
  ]
}
```

#### 48. §3.1 · catalog — video-ads.generate?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/video-ads.generate?plan=creative` → **200** · request-id `86380494-2ff3-44d6-bf9e-fb1783e95d79` · 766 ms · raw `catalog/video-ads.generate.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.07"
      },
      "schemaKeys": [
        "seed",
        "imageUrl",
        "durationS",
        "negativePrompt"
      ]
    }
  ]
}
```

#### 49. §3.1 · catalog — video-ads.generate?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/video-ads.generate?plan=precise` → **200** · request-id `82c17eaa-18ed-4b20-a944-582137b8e835` · 758 ms · raw `catalog/video-ads.generate.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.112"
      },
      "schemaKeys": [
        "seed",
        "imageUrl",
        "durationS",
        "negativePrompt"
      ]
    }
  ]
}
```

#### 50. §3.1 · catalog — voice.speak?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/voice.speak?plan=balanced` → **200** · request-id `5cb738e9-8e95-4976-9df6-6e8f768d89a9` · 745 ms · raw `catalog/voice.speak.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "voice-turbo",
      "kind": "audio",
      "plan": null,
      "cost": {
        "audio_text_units": "0.05"
      },
      "schemaKeys": [
        "lang",
        "speed",
        "voice",
        "stability",
        "similarity"
      ]
    }
  ]
}
```

#### 51. §3.1 · catalog — voice.speak?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/voice.speak?plan=creative` → **200** · request-id `aab599e7-528b-44db-acf3-1661ed91ce76` · 590 ms · raw `catalog/voice.speak.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "voice-multilingual",
      "kind": "audio",
      "plan": null,
      "cost": {
        "audio_text_units": "0.1"
      },
      "schemaKeys": [
        "lang",
        "speed",
        "voice",
        "stability",
        "similarity"
      ]
    }
  ]
}
```

#### 52. §3.1 · catalog — voice.speak?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/voice.speak?plan=precise` → **200** · request-id `3a0f6a3b-aca5-4971-9c96-1aa843c9ee16` · 595 ms · raw `catalog/voice.speak.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "voice-expressive",
      "kind": "audio",
      "plan": null,
      "cost": {
        "audio_text_units": "0.1"
      },
      "schemaKeys": [
        "lang",
        "voice",
        "stability"
      ]
    }
  ]
}
```

#### 53. §3.1 · catalog — film.generate?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/film.generate?plan=balanced` → **200** · request-id `f59377ed-6fd0-4a7d-b974-bec01cea000e` · 756 ms · raw `catalog/film.generate.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "video-scene-core",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.14"
      },
      "schemaKeys": [
        "shots",
        "durationS",
        "aspectRatio",
        "generateAudio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 54. §3.1 · catalog — film.generate?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/film.generate?plan=creative` → **200** · request-id `68d2d5db-d5c8-4929-a334-3f8839c93c28` · 746 ms · raw `catalog/film.generate.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "video-scene-plus",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.3034",
        "video_seconds_by_resolution": {
          "4k": "2.7306",
          "480p": "0.1415",
          "720p": "0.3034",
          "1080p": "0.6827"
        }
      },
      "schemaKeys": [
        "audioUrl",
        "durationS",
        "resolution",
        "aspectRatio",
        "generateAudio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 55. §3.1 · catalog — film.generate?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/film.generate?plan=precise` → **200** · request-id `c6f030c5-1ff2-47df-bf8d-8e4c90bed680` · 677 ms · raw `catalog/film.generate.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "video-scene-top",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.473",
        "video_seconds_by_resolution": {
          "480p": "0.2205",
          "720p": "0.473",
          "1080p": "1.0643"
        }
      },
      "schemaKeys": [
        "audioUrl",
        "durationS",
        "resolution",
        "aspectRatio",
        "generateAudio",
        "referenceImages"
      ]
    }
  ]
}
```

#### 56. §3.1 · catalog — motion.generate?plan=balanced

`GET /orgs/:id/alphastudio/catalog/capabilities/motion.generate?plan=balanced` → **200** · request-id `8c4470b4-a1c9-4d4a-951f-ef5254b31e40` · 822 ms · raw `catalog/motion.generate.plan-balanced.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "balanced",
  "models": [
    {
      "alias": "video-motion-core",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.07"
      },
      "schemaKeys": [
        "imageUrl",
        "videoUrl",
        "keepSound",
        "orientation"
      ]
    }
  ]
}
```

#### 57. §3.1 · catalog — motion.generate?plan=creative

`GET /orgs/:id/alphastudio/catalog/capabilities/motion.generate?plan=creative` → **200** · request-id `1fffcd4f-56c6-4be0-a118-2fcddf5bf633` · 716 ms · raw `catalog/motion.generate.plan-creative.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "creative",
  "models": [
    {
      "alias": "video-motion-plus",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.112"
      },
      "schemaKeys": [
        "imageUrl",
        "videoUrl",
        "keepSound",
        "orientation"
      ]
    }
  ]
}
```

#### 58. §3.1 · catalog — motion.generate?plan=precise

`GET /orgs/:id/alphastudio/catalog/capabilities/motion.generate?plan=precise` → **200** · request-id `f87ea4e6-8c49-4e75-a76a-3da69ea75680` · 742 ms · raw `catalog/motion.generate.plan-precise.json`

```json
{
  "summarised": true,
  "selectable": true,
  "field": "plan",
  "plan": "precise",
  "models": [
    {
      "alias": "video-motion-top",
      "kind": "video",
      "plan": null,
      "cost": {
        "video_seconds": "0.126"
      },
      "schemaKeys": [
        "imageUrl",
        "videoUrl",
        "keepSound",
        "orientation"
      ]
    }
  ]
}
```

#### 59. §3.5 · POST media/assets/:id/approve — no body

`POST /orgs/:id/alphastudio/media/assets/masset_b24afbaa6bcb30f68af48c8e/approve` → **404** · request-id `ecca3ba8-2e5f-4435-8a19-126e26e1a1b1` · 436 ms · raw `approve/no-body.json`

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### 60. wallet — re-read immediately before any job body

`GET /orgs/:id/alphastudio/wallet` → **200** · request-id `cd47534b-733e-4e8e-9639-6b7645d7bd91` · 729 ms · raw `setup/wallet-shield.json`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

#### 61. §3.2 · media/jobs — media.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `819e1a08-2e16-40f0-9278-addc08fd0697` · 1024 ms · raw `jobs/valid-media.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "media.generate",
    "plan": "balanced",
    "kind": "image",
    "prompt": "a flat-vector report cover, deep navy, generous negative space",
    "params": {
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "headline",
        "text": "Poor data quality costs $12.9M a year"
      },
      {
        "role": "palette",
        "text": "deep navy, slate grey, one teal accent"
      }
    ],
    "collection": {
      "use": true,
      "hint": "our mark and the product shot"
    }
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "819e1a08-2e16-40f0-9278-addc08fd0697"
  }
}
```

#### 62. §3.2 · media/jobs — images.edit · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `85b2a2ee-f28f-41db-a522-72807f15f78e` · 816 ms · raw `jobs/valid-images.edit--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "images.edit",
    "instruction": "replace the background with a plain deep-navy studio backdrop",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "1:1",
      "outputFormat": "png"
    }
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "85b2a2ee-f28f-41db-a522-72807f15f78e"
  }
}
```

#### 63. §3.2 · media/jobs — photoshoot.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `44a0a3a6-c0a1-4742-9d75-c4fba2caa7bb` · 645 ms · raw `jobs/valid-photoshoot.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "photoshoot.generate",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "scene",
        "text": "on a brushed-steel table in a glass-walled briefing room"
      },
      {
        "role": "style",
        "text": "corporate editorial photography, soft key light"
      },
      {
        "role": "palette",
        "text": "cool neutrals, deep navy, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "44a0a3a6-c0a1-4742-9d75-c4fba2caa7bb"
  }
}
```

#### 64. §3.2 · media/jobs — brand-assets.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `9f2e6a8f-20cb-4024-ad48-fa2a751a3760` · 815 ms · raw `jobs/valid-brand-assets.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "brand-assets.generate",
    "params": {
      "count": 2
    },
    "guidance": [
      {
        "role": "subject",
        "text": "a wordmark for 'Alpha Pro MENA' with a compact abstract mark above it"
      },
      {
        "role": "style",
        "text": "flat, minimal, enterprise-grade — a working mark, not an illustration"
      },
      {
        "role": "palette",
        "text": "deep navy on warm off-white, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "9f2e6a8f-20cb-4024-ad48-fa2a751a3760"
  }
}
```

#### 65. §3.2 · media/jobs — logos.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `67368604-88a8-464a-8aee-92cb1f6fda2c` · 811 ms · raw `jobs/valid-logos.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "logos.generate",
    "plan": "balanced",
    "params": {
      "count": 1,
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "headline",
        "text": "Alpha Pro MENA"
      },
      {
        "role": "subject",
        "text": "a data-lineage platform; three aligned nodes joined by one line"
      },
      {
        "role": "style",
        "text": "flat, geometric — a working mark for a browser tab and a slide master"
      },
      {
        "role": "palette",
        "text": "deep navy on warm off-white, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "67368604-88a8-464a-8aee-92cb1f6fda2c"
  }
}
```

#### 66. §3.2 · media/jobs — logos.redesign · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `9697d8a8-9d6c-4f51-a773-e2dce866e496` · 800 ms · raw `jobs/valid-logos.redesign--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "logos.redesign",
    "plan": "balanced",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>"
      ],
      "count": 1,
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "style",
        "text": "simpler geometry, more negative space, lighter type; keep it recognisable"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "9697d8a8-9d6c-4f51-a773-e2dce866e496"
  }
}
```

#### 67. §3.2 · media/jobs — avatars.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `89869739-c2a2-4619-ada0-0368225cfde2` · 671 ms · raw `jobs/valid-avatars.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "avatars.generate",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>"
      ],
      "count": 1
    },
    "guidance": [
      {
        "role": "style",
        "text": "corporate headshot, navy blazer, plain light backdrop"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "89869739-c2a2-4619-ada0-0368225cfde2"
  }
}
```

#### 68. §3.2 · media/jobs — avatars.imagine · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `d8a3f8be-5610-4290-9082-279bad3a5efd` · 814 ms · raw `jobs/valid-avatars.imagine--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "avatars.imagine",
    "instruction": "an Arabian woman in her thirties wearing a hijab",
    "params": {
      "count": 1
    }
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "d8a3f8be-5610-4290-9082-279bad3a5efd"
  }
}
```

#### 69. §3.2 · media/jobs — avatar.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `bc9c3042-dd29-45e0-90dc-a6cbbc1c7f3d` · 648 ms · raw `jobs/valid-avatar.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "avatar.generate",
    "plan": "balanced",
    "instruction": "a man in his forties with a short grey beard, in a dark blazer",
    "params": {
      "count": 2,
      "referenceImages": [
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "3:2"
    },
    "guidance": []
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "bc9c3042-dd29-45e0-90dc-a6cbbc1c7f3d"
  }
}
```

#### 70. §3.2 · media/jobs — video-ads.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `c3df40e7-8b03-447e-812c-f8f3553fe00b` · 816 ms · raw `jobs/valid-video-ads.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "video-ads.generate",
    "plan": "balanced",
    "params": {
      "imageUrl": "<redacted url: 1621 chars>",
      "durationS": 5
    },
    "guidance": [
      {
        "role": "motion",
        "text": "slow push-in, the product turning once, ending centred"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "c3df40e7-8b03-447e-812c-f8f3553fe00b"
  }
}
```

#### 71. §3.2 · media/jobs — voice.speak · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `7c7b99af-747e-4363-91f0-8e4bff4beb9f` · 805 ms · raw `jobs/valid-voice.speak--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "voice.speak",
    "plan": "balanced",
    "prompt": "Welcome to Alpha Pro. Here is what changed this week.",
    "params": {
      "voice": "Rachel",
      "lang": "en",
      "stability": 0.5,
      "similarity": 0.75,
      "speed": 1
    }
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "7c7b99af-747e-4363-91f0-8e4bff4beb9f"
  }
}
```

#### 72. §3.2 · media/jobs — film.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `ae3434e6-6c1a-4115-88de-450a48955798` · 1110 ms · raw `jobs/valid-film.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "film.generate",
    "plan": "balanced",
    "sec": 3,
    "aspect": "9:16",
    "audio": true,
    "scenes": [
      {
        "sec": 2,
        "speak": "none",
        "camera": "wide establishing shot of a sunlit café, morning light"
      },
      {
        "sec": 1,
        "camera": "slow push toward a coffee cup, steam rising"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "ae3434e6-6c1a-4115-88de-450a48955798"
  }
}
```

#### 73. §3.2 · media/jobs — motion.generate · document-example

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `06e3b44c-7e9f-4c07-91eb-ecd36516cbd4` · 740 ms · raw `jobs/valid-motion.generate--document-example.json`
> the document’s example; 402 expected on the zero wallet

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_1508fa6f5391e767f91d2df2",
    "video": "masset_f8737222c97ea8030669bb3b",
    "orientation": "image",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery; soft office light",
    "lang": "ar"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "06e3b44c-7e9f-4c07-91eb-ecd36516cbd4"
  }
}
```

#### 74. §3.2 · media/jobs — media.generate · with-origin

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `96be7711-9e65-4ba4-9672-52b59f9fa7d8` · 840 ms · raw `jobs/valid-media.generate--with-origin.json`
> the shared `origin` keys of the document’s “Read this first”; 402 expected

```json
{
  "request": {
    "capability": "media.generate",
    "plan": "balanced",
    "kind": "image",
    "prompt": "a flat-vector report cover, deep navy, generous negative space",
    "params": {
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "headline",
        "text": "Poor data quality costs $12.9M a year"
      },
      {
        "role": "palette",
        "text": "deep navy, slate grey, one teal accent"
      }
    ],
    "collection": {
      "use": true,
      "hint": "our mark and the product shot"
    },
    "origin": {
      "kind": "standalone",
      "ref": "hsn-0910-phase0"
    }
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "96be7711-9e65-4ba4-9672-52b59f9fa7d8"
  }
}
```

#### 75. §3.2 · media/jobs — film.generate · with-references-and-character

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `46012f19-4b3c-453d-8ed7-74805651e99c` · 1041 ms · raw `jobs/valid-film.generate--with-references-and-character.json`
> our own uploaded asset id as a scene reference and as the character source (A3); 402 expected

```json
{
  "request": {
    "capability": "film.generate",
    "plan": "balanced",
    "sec": 3,
    "aspect": "9:16",
    "audio": true,
    "scenes": [
      {
        "sec": 2,
        "speak": "none",
        "references": [
          "masset_b24afbaa6bcb30f68af48c8e"
        ],
        "camera": "wide establishing shot of a sunlit café, morning light"
      },
      {
        "sec": 1,
        "camera": "slow push toward a coffee cup, steam rising"
      }
    ],
    "character": {
      "source": "masset_b24afbaa6bcb30f68af48c8e",
      "desc": "a woman in her thirties, business-casual"
    }
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "46012f19-4b3c-453d-8ed7-74805651e99c"
  }
}
```

#### 76. §3.2 · media/jobs — photoshoot.generate · four-referenceImages

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `06a8212a-b28e-4121-b681-5a46821cd0f5` · 790 ms · raw `jobs/valid-photoshoot.generate--four-referenceImages.json`
> the document’s maximum of four reference urls; 402 expected

```json
{
  "request": {
    "capability": "photoshoot.generate",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "scene",
        "text": "on a brushed-steel table in a glass-walled briefing room"
      },
      {
        "role": "style",
        "text": "corporate editorial photography, soft key light"
      },
      {
        "role": "palette",
        "text": "cool neutrals, deep navy, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "06a8212a-b28e-4121-b681-5a46821cd0f5"
  }
}
```

#### 77. §3.2 · media/jobs — motion.generate · ladder-1x1-still-5s-clip

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `0d07350b-ef74-4b15-a020-5870b73406be` · 836 ms · raw `jobs/valid-motion.generate--ladder-1x1-still-5s-clip.json`
> the example with the 1×1 still and the 5 s clip

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_b24afbaa6bcb30f68af48c8e",
    "video": "masset_f8737222c97ea8030669bb3b",
    "orientation": "image",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery; soft office light",
    "lang": "ar"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "0d07350b-ef74-4b15-a020-5870b73406be"
  }
}
```

#### 78. §3.2 · media/jobs — motion.generate · ladder-512-still-3s-clip

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `5fc4499a-2256-4a1d-baf6-fb5cbd1fe166` · 856 ms · raw `jobs/valid-motion.generate--ladder-512-still-3s-clip.json`
> the example with the 512 px still and the 3.0 s clip

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_1508fa6f5391e767f91d2df2",
    "video": "masset_8ea12cc8634160529ee6834c",
    "orientation": "image",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery; soft office light",
    "lang": "ar"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "5fc4499a-2256-4a1d-baf6-fb5cbd1fe166"
  }
}
```

#### 79. §3.2 · media/jobs — motion.generate · ladder-1x1-still-3s-clip

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `b64b2e16-c233-4fea-84c8-ecf718f26805` · 979 ms · raw `jobs/valid-motion.generate--ladder-1x1-still-3s-clip.json`
> run 1’s body (org 1823): the 1×1 still and the 3.0 s clip

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_b24afbaa6bcb30f68af48c8e",
    "video": "masset_8ea12cc8634160529ee6834c",
    "orientation": "image",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery; soft office light",
    "lang": "ar"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "b64b2e16-c233-4fea-84c8-ecf718f26805"
  }
}
```

#### 80. §3.2 · media/jobs — motion.generate · ladder-required-keys-only

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `6be43768-38be-4081-b919-0f62bce58746` · 862 ms · raw `jobs/valid-motion.generate--ladder-required-keys-only.json`
> only capability, plan, image, video, orientation

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_1508fa6f5391e767f91d2df2",
    "video": "masset_f8737222c97ea8030669bb3b",
    "orientation": "image"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "6be43768-38be-4081-b919-0f62bce58746"
  }
}
```

#### 81. §3.2 · media/jobs — motion.generate · ladder-plus-keepSound-prompt

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `66fe7703-3f28-4984-b28f-5fa853c574b4` · 1094 ms · raw `jobs/valid-motion.generate--ladder-plus-keepSound-prompt.json`
> the required keys plus keepSound and prompt

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_1508fa6f5391e767f91d2df2",
    "video": "masset_f8737222c97ea8030669bb3b",
    "orientation": "image",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery; soft office light"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "66fe7703-3f28-4984-b28f-5fa853c574b4"
  }
}
```

#### 82. §3.2 · media/jobs — motion.generate · ladder-plus-lang-ar

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `78236865-ab0f-4144-aa6a-01b5e53f2238` · 909 ms · raw `jobs/valid-motion.generate--ladder-plus-lang-ar.json`
> the required keys plus lang "ar"

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_1508fa6f5391e767f91d2df2",
    "video": "masset_f8737222c97ea8030669bb3b",
    "orientation": "image",
    "lang": "ar"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "78236865-ab0f-4144-aa6a-01b5e53f2238"
  }
}
```

#### 83. §3.2 · media/jobs — motion.generate · ladder-orientation-video

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `3269bc85-738a-4cdb-b410-6922df4450fa` · 839 ms · raw `jobs/valid-motion.generate--ladder-orientation-video.json`
> the example with orientation "video"

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_1508fa6f5391e767f91d2df2",
    "video": "masset_f8737222c97ea8030669bb3b",
    "orientation": "video",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery; soft office light",
    "lang": "ar"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "3269bc85-738a-4cdb-b410-6922df4450fa"
  }
}
```

#### 84. §3.3 · media/jobs — images.edit · two-referenceImages

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `1df664d7-1b1b-4fed-8b67-31d711530e7c` · 767 ms · raw `jobs/trap-images.edit--two-referenceImages.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "images.edit",
    "instruction": "replace the background with a plain deep-navy studio backdrop",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "1:1",
      "outputFormat": "png"
    }
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "1df664d7-1b1b-4fed-8b67-31d711530e7c"
  }
}
```

#### 85. §3.3 · media/jobs — photoshoot.generate · five-referenceImages

`POST /orgs/:id/alphastudio/media/jobs` → **502** · request-id `2b59e0ce-9a2e-40ab-b0ba-cff566220b1f` · 449 ms · raw `jobs/trap-photoshoot.generate--five-referenceImages.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "photoshoot.generate",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "scene",
        "text": "on a brushed-steel table in a glass-walled briefing room"
      },
      {
        "role": "style",
        "text": "corporate editorial photography, soft key light"
      },
      {
        "role": "palette",
        "text": "cool neutrals, deep navy, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_gateway",
    "message": "The media service is unavailable — try again later",
    "requestId": "2b59e0ce-9a2e-40ab-b0ba-cff566220b1f"
  }
}
```

#### 86. §3.3 · media/jobs — photoshoot.generate · five-referenceImages-again

`POST /orgs/:id/alphastudio/media/jobs` → **502** · request-id `b81bb7bd-1161-4572-bd10-e28cd98e61e0` · 443 ms · raw `jobs/trap-photoshoot.generate--five-referenceImages-again.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "photoshoot.generate",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>",
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "scene",
        "text": "on a brushed-steel table in a glass-walled briefing room"
      },
      {
        "role": "style",
        "text": "corporate editorial photography, soft key light"
      },
      {
        "role": "palette",
        "text": "cool neutrals, deep navy, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_gateway",
    "message": "The media service is unavailable — try again later",
    "requestId": "b81bb7bd-1161-4572-bd10-e28cd98e61e0"
  }
}
```

#### 87. §3.3 · media/jobs — brand-assets.generate · count-1

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `5162c97b-2fb2-4e30-adc8-94041fe9f6f0` · 759 ms · raw `jobs/trap-brand-assets.generate--count-1.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "brand-assets.generate",
    "params": {
      "count": 1
    },
    "guidance": [
      {
        "role": "subject",
        "text": "a wordmark for 'Alpha Pro MENA' with a compact abstract mark above it"
      },
      {
        "role": "style",
        "text": "flat, minimal, enterprise-grade — a working mark, not an illustration"
      },
      {
        "role": "palette",
        "text": "deep navy on warm off-white, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "5162c97b-2fb2-4e30-adc8-94041fe9f6f0"
  }
}
```

#### 88. §3.3 · media/jobs — logos.generate · count-21

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `a957d534-defc-43aa-9c0b-f9798842f2c5` · 752 ms · raw `jobs/trap-logos.generate--count-21.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "logos.generate",
    "plan": "balanced",
    "params": {
      "count": 21,
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "headline",
        "text": "Alpha Pro MENA"
      },
      {
        "role": "subject",
        "text": "a data-lineage platform; three aligned nodes joined by one line"
      },
      {
        "role": "style",
        "text": "flat, geometric — a working mark for a browser tab and a slide master"
      },
      {
        "role": "palette",
        "text": "deep navy on warm off-white, one teal accent"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "a957d534-defc-43aa-9c0b-f9798842f2c5"
  }
}
```

#### 89. §3.3 · media/jobs — logos.redesign · no-referenceImages

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `27dae99d-7c08-4a03-b147-f30727ccafa0` · 791 ms · raw `jobs/trap-logos.redesign--no-referenceImages.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "logos.redesign",
    "plan": "balanced",
    "params": {
      "count": 1,
      "aspectRatio": "1:1",
      "outputFormat": "png"
    },
    "guidance": [
      {
        "role": "style",
        "text": "simpler geometry, more negative space, lighter type; keep it recognisable"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "27dae99d-7c08-4a03-b147-f30727ccafa0"
  }
}
```

#### 90. §3.3 · media/jobs — avatars.generate · count-9

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `54e04f7d-6523-4d15-991f-00b3049b3e3a` · 595 ms · raw `jobs/trap-avatars.generate--count-9.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "avatars.generate",
    "params": {
      "referenceImages": [
        "<redacted url: 1621 chars>"
      ],
      "count": 9
    },
    "guidance": [
      {
        "role": "style",
        "text": "corporate headshot, navy blazer, plain light backdrop"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "54e04f7d-6523-4d15-991f-00b3049b3e3a"
  }
}
```

#### 91. §3.3 · media/jobs — avatars.imagine · instruction-601-chars

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `2f7bf8df-d38d-46bd-9b17-e073f31f5245` · 751 ms · raw `jobs/trap-avatars.imagine--instruction-601-chars.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "avatars.imagine",
    "instruction": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "params": {
      "count": 1
    }
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "2f7bf8df-d38d-46bd-9b17-e073f31f5245"
  }
}
```

#### 92. §3.3 · media/jobs — avatar.generate · count-9

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `68d7ff29-a620-4b40-896f-84f084f68de7` · 760 ms · raw `jobs/trap-avatar.generate--count-9.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "avatar.generate",
    "plan": "balanced",
    "instruction": "a man in his forties with a short grey beard, in a dark blazer",
    "params": {
      "count": 9,
      "referenceImages": [
        "<redacted url: 1621 chars>"
      ],
      "aspectRatio": "3:2"
    },
    "guidance": []
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "68d7ff29-a620-4b40-896f-84f084f68de7"
  }
}
```

#### 93. §3.3 · media/jobs — video-ads.generate · aspectRatio

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `e5409135-c3e2-4982-b819-e7ff27ffc9ad` · 791 ms · raw `jobs/trap-video-ads.generate--aspectRatio.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "video-ads.generate",
    "plan": "balanced",
    "params": {
      "imageUrl": "<redacted url: 1621 chars>",
      "durationS": 5,
      "aspectRatio": "16:9"
    },
    "guidance": [
      {
        "role": "motion",
        "text": "slow push-in, the product turning once, ending centred"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "e5409135-c3e2-4982-b819-e7ff27ffc9ad"
  }
}
```

#### 94. §3.3 · media/jobs — video-ads.generate · generateAudio-true

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `fa7f7ff0-238d-44e4-a853-112a8ca3c8c8` · 767 ms · raw `jobs/trap-video-ads.generate--generateAudio-true.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "video-ads.generate",
    "plan": "balanced",
    "params": {
      "imageUrl": "<redacted url: 1621 chars>",
      "durationS": 5,
      "generateAudio": true
    },
    "guidance": [
      {
        "role": "motion",
        "text": "slow push-in, the product turning once, ending centred"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "fa7f7ff0-238d-44e4-a853-112a8ca3c8c8"
  }
}
```

#### 95. §3.3 · media/jobs — video-ads.generate · durationS-8

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `cc29eb5d-c41c-4725-80e1-12d37b0f248d` · 748 ms · raw `jobs/trap-video-ads.generate--durationS-8.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "video-ads.generate",
    "plan": "balanced",
    "params": {
      "imageUrl": "<redacted url: 1621 chars>",
      "durationS": 8
    },
    "guidance": [
      {
        "role": "motion",
        "text": "slow push-in, the product turning once, ending centred"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "cc29eb5d-c41c-4725-80e1-12d37b0f248d"
  }
}
```

#### 96. §3.3 · media/jobs — voice.speak · unapproved-voice

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `35d55872-e0f6-4cb4-a2cb-41dea02bb78d` · 790 ms · raw `jobs/trap-voice.speak--unapproved-voice.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "voice.speak",
    "plan": "balanced",
    "prompt": "Welcome to Alpha Pro. Here is what changed this week.",
    "params": {
      "voice": "NotAnApprovedVoice",
      "lang": "en",
      "stability": 0.5,
      "similarity": 0.75,
      "speed": 1
    }
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "35d55872-e0f6-4cb4-a2cb-41dea02bb78d"
  }
}
```

#### 97. §3.3 · media/jobs — voice.speak · similarity-on-precise

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `4c26ec82-af6e-4ad4-b6a0-53198f12523a` · 787 ms · raw `jobs/trap-voice.speak--similarity-on-precise.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "voice.speak",
    "plan": "precise",
    "prompt": "Welcome to Alpha Pro. Here is what changed this week.",
    "params": {
      "voice": "Rachel",
      "lang": "en",
      "stability": 0.5,
      "similarity": 0.75
    }
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "4c26ec82-af6e-4ad4-b6a0-53198f12523a"
  }
}
```

#### 98. §3.3 · media/jobs — film.generate · resolution-on-balanced

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `2182114e-e2ec-47f0-b77b-c7c570c1dd19` · 777 ms · raw `jobs/trap-film.generate--resolution-on-balanced.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "film.generate",
    "plan": "balanced",
    "sec": 3,
    "aspect": "9:16",
    "audio": true,
    "scenes": [
      {
        "sec": 2,
        "speak": "none",
        "camera": "wide establishing shot of a sunlit café, morning light"
      },
      {
        "sec": 1,
        "camera": "slow push toward a coffee cup, steam rising"
      }
    ],
    "resolution": "720p"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "2182114e-e2ec-47f0-b77b-c7c570c1dd19"
  }
}
```

#### 99. §3.3 · media/jobs — film.generate · talking-on-balanced

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `5348b5e9-2c30-48e5-b14c-859af17ccf58` · 980 ms · raw `jobs/trap-film.generate--talking-on-balanced.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "film.generate",
    "plan": "balanced",
    "sec": 3,
    "aspect": "9:16",
    "audio": true,
    "scenes": [
      {
        "sec": 2,
        "speak": "talking",
        "script": "Welcome to Alpha Pro. Here is what changed this week.",
        "camera": "a presenter at a desk, medium shot"
      },
      {
        "sec": 1,
        "camera": "slow push toward a coffee cup, steam rising"
      }
    ],
    "lang": "en",
    "voice": {
      "id": "Rachel"
    }
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "5348b5e9-2c30-48e5-b14c-859af17ccf58"
  }
}
```

#### 100. §3.3 · media/jobs — film.generate · scenes-do-not-sum

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `f95e33be-02c4-4d5a-a619-d34434888660` · 747 ms · raw `jobs/trap-film.generate--scenes-do-not-sum.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "film.generate",
    "plan": "balanced",
    "sec": 3,
    "aspect": "9:16",
    "audio": true,
    "scenes": [
      {
        "sec": 2,
        "camera": "wide establishing shot"
      },
      {
        "sec": 2,
        "camera": "slow push in"
      }
    ]
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "f95e33be-02c4-4d5a-a619-d34434888660"
  }
}
```

#### 101. §3.3 · media/jobs — motion.generate · no-orientation

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `6e89ef49-30f5-4db3-8960-c942f02d80e3` · 753 ms · raw `jobs/trap-motion.generate--no-orientation.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_b24afbaa6bcb30f68af48c8e",
    "video": "masset_8ea12cc8634160529ee6834c",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "6e89ef49-30f5-4db3-8960-c942f02d80e3"
  }
}
```

#### 102. §3.3 · media/jobs — media.generate · unknown-param-key

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `cf3a7e0a-3a26-47a0-9155-253a9fc61fd3` · 819 ms · raw `jobs/trap-media.generate--unknown-param-key.json`
> the document’s refusal; 400 expected BEFORE the wallet

```json
{
  "request": {
    "capability": "media.generate",
    "plan": "balanced",
    "kind": "image",
    "prompt": "a flat-vector report cover, deep navy, generous negative space",
    "params": {
      "aspectRatio": "1:1",
      "outputFormat": "png",
      "foo": "bar"
    },
    "guidance": [
      {
        "role": "headline",
        "text": "Poor data quality costs $12.9M a year"
      },
      {
        "role": "palette",
        "text": "deep navy, slate grey, one teal accent"
      }
    ],
    "collection": {
      "use": true,
      "hint": "our mark and the product shot"
    }
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "cf3a7e0a-3a26-47a0-9155-253a9fc61fd3"
  }
}
```

#### 103. wallet — after every refused body

`GET /orgs/:id/alphastudio/wallet` → **200** · request-id `29fe6be9-e17c-4657-b253-e1d554f7f009` · 900 ms · raw `after/wallet.json`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

#### 104. media/jobs — list after (no job may exist)

`GET /orgs/:id/alphastudio/media/jobs` → **200** · request-id `6eb52963-f7d6-4c30-98c8-acfcf8554db6` · 995 ms · raw `after/jobs.json`

```json
{
  "jobs": []
}
```

#### 105. §3.7a · GET event-sources/countries — does a row carry states?

`GET /orgs/:id/event-sources/countries` → **200** · request-id `2f9f27b1-bf9a-4971-86b4-07e12f3caaf9` · 539 ms · raw `state/countries.json`

```json
{
  "summarised": true,
  "total": 249,
  "rowKeys": [
    "code",
    "name"
  ],
  "first": [
    {
      "code": "AF",
      "name": "Afghanistan"
    },
    {
      "code": "AX",
      "name": "Åland Islands"
    },
    {
      "code": "AL",
      "name": "Albania"
    },
    {
      "code": "DZ",
      "name": "Algeria"
    },
    {
      "code": "AS",
      "name": "American Samoa"
    }
  ],
  "note": "249 rows verbatim in the raw file"
}
```

#### 106. §3.7b · PUT /orgs/:id/country — {country:"US", state:"CA"}

`PUT /orgs/:id/country` → **200** · request-id `79ffe011-947b-4ad2-938a-d139a0e48a0d` · 20391 ms · raw `state/put-country-us-ca.json`
> accepted, dropped, or 400? (~10 s: it loads a calendar)

```json
{
  "request": {
    "country": "US",
    "state": "CA"
  }
}
```

```json
{
  "org": {
    "id": "1824",
    "name": "QA HSN-0910 Org 1789026912812",
    "slug": "qa-hsn-0910-org-1789026912812",
    "status": "active",
    "createdAt": "2026-09-10T07:55:21.368Z",
    "updatedAt": "2026-09-10T07:57:13.226Z",
    "country": "US"
  },
  "holidaysCount": 10,
  "reloaded": true
}
```

#### 107. §3.7b · GET /orgs/:id — read back (does the org carry a state?)

`GET /orgs/:id` → **200** · request-id `cec29cdc-ce2b-4743-bf9e-a41d36d8ea4d` · 578 ms · raw `state/org-after-put.json`

```json
{
  "org": {
    "id": "1824",
    "name": "QA HSN-0910 Org 1789026912812",
    "slug": "qa-hsn-0910-org-1789026912812",
    "status": "active",
    "createdAt": "2026-09-10T07:55:21.368Z",
    "updatedAt": "2026-09-10T07:57:13.226Z",
    "country": "US"
  },
  "membership": {
    "id": "2083",
    "orgId": "1824",
    "userId": "2210",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-09-10T07:55:21.368Z",
    "updatedAt": "2026-09-10T07:55:21.368Z"
  }
}
```

#### 108. §3.7d · GET /orgs/:id/holidays?limit=100 — the rows’ shape

`GET /orgs/:id/holidays?limit=100` → **200** · request-id `4fbc1b3f-902d-4cc1-81f2-be67aff23b21` · 635 ms · raw `state/holidays.json`

```json
{
  "items": [
    {
      "id": "864",
      "orgId": "1824",
      "date": "2026-10-12",
      "event": "Columbus Day",
      "rules": [
        {
          "kind": "do",
          "text": "Acknowledge the federal holiday and the growing recognition of Indigenous Peoples' Day alongside it, reflecting the dual conversation many Americans are having."
        },
        {
          "kind": "dont",
          "text": "Don't frame it as a straightforward celebration of exploration — the contested history means a one-sided tone will alienate a significant portion of your audience."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "865",
      "orgId": "1824",
      "date": "2026-10-31",
      "event": "Halloween",
      "rules": [
        {
          "kind": "do",
          "text": "Lean into playful, lighthearted creative — costumes, candy, and seasonal imagery resonate broadly and invite audience participation."
        },
        {
          "kind": "dont",
          "text": "Avoid costumes or imagery that appropriate cultural or religious identities, as these reliably draw backlash."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "866",
      "orgId": "1824",
      "date": "2026-11-01",
      "event": "Daylight Saving Time ends",
      "rules": [
        {
          "kind": "do",
          "text": "Use the 'extra hour' framing as a light, relatable hook — it's a shared moment that works well for casual engagement content."
        },
        {
          "kind": "dont",
          "text": "Don't build time-sensitive campaigns around this date without accounting for the clock change affecting scheduled posts and notifications."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "867",
      "orgId": "1824",
      "date": "2026-11-03",
      "event": "Election Day",
      "rules": [
        {
          "kind": "do",
          "text": "Encourage civic participation with a nonpartisan 'go vote' message — this is broadly welcomed and low-risk for most brands."
        },
        {
          "kind": "dont",
          "text": "Don't express support for any candidate, party, or ballot position, as political endorsements carry serious reputational and legal risk."
        },
        {
          "kind": "dont",
          "text": "Avoid launching major promotional campaigns on this day, as they can read as tone-deaf against the weight of a national election."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "868",
      "orgId": "1824",
      "date": "2026-11-11",
      "event": "Veterans Day",
      "rules": [
        {
          "kind": "do",
          "text": "Express genuine gratitude to veterans and active service members — specific, sincere acknowledgment lands far better than generic patriotic copy."
        },
        {
          "kind": "dont",
          "text": "Don't use Veterans Day primarily as a sales hook; promotional framing around this day reads as exploitative and frequently draws criticism."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "869",
      "orgId": "1824",
      "date": "2026-11-26",
      "event": "Thanksgiving Day",
      "rules": [
        {
          "kind": "do",
          "text": "Focus messaging on gratitude, community, and togetherness — these themes connect across the wide range of ways Americans celebrate the day."
        },
        {
          "kind": "dont",
          "text": "Avoid romanticized colonial imagery or the traditional Pilgrim-and-Native narrative, which many audiences now find reductive or offensive."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "870",
      "orgId": "1824",
      "date": "2026-11-27",
      "event": "Black Friday",
      "rules": [
        {
          "kind": "do",
          "text": "This is one of the highest-intent shopping days of the year — clear, direct promotional messaging with specific offers performs best."
        },
        {
          "kind": "dont",
          "text": "Don't ignore the counter-narrative around consumerism; if your brand values sustainability or mindful spending, acknowledge it rather than pretending Black Friday is uncomplicated."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "871",
      "orgId": "1824",
      "date": "2026-12-24",
      "event": "Christmas Eve",
      "rules": [
        {
          "kind": "do",
          "text": "Warm, family-oriented content works well — this is a moment of anticipation and togetherness for the large share of your audience celebrating."
        },
        {
          "kind": "dont",
          "text": "Don't assume your entire audience celebrates Christmas; inclusive seasonal language keeps the message welcoming to those observing other holidays or none."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "872",
      "orgId": "1824",
      "date": "2026-12-25",
      "event": "Christmas Day",
      "rules": [
        {
          "kind": "do",
          "text": "A brief, warm acknowledgment is appropriate — most audiences expect brands to mark the day, and a simple message of goodwill is well received."
        },
        {
          "kind": "dont",
          "text": "Avoid heavy promotional content on Christmas Day itself; audiences are with family and sales-first messaging feels intrusive."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    },
    {
      "id": "873",
      "orgId": "1824",
      "date": "2026-12-31",
      "event": "New Year's Eve",
      "rules": [
        {
          "kind": "do",
          "text": "Reflective, forward-looking content — celebrating the year and welcoming the next — resonates widely and gives your brand a natural, positive close to the calendar."
        },
        {
          "kind": "dont",
          "text": "Don't schedule posts for midnight without confirming time-zone targeting; a New Year's message arriving at 3 a.m. local time loses its impact entirely."
        }
      ],
      "createdAt": "2026-09-10T07:57:13.226Z",
      "processed": false
    }
  ],
  "total": 10
}
```

#### 109. §3.7c · POST event-sources — {kind:"holidays", country:"US", state:"CA"}

`POST /orgs/:id/event-sources` → **201** · request-id `efc30c5b-ef94-4495-afc8-8292122cc393` · 918 ms · raw `state/post-event-source-us-ca.json`

```json
{
  "request": {
    "kind": "holidays",
    "country": "US",
    "state": "CA"
  }
}
```

```json
{
  "id": "111",
  "orgId": "1824",
  "kind": "holidays",
  "country": "US",
  "createdAt": "2026-09-10T07:57:15.459Z",
  "updatedAt": "2026-09-10T07:57:15.459Z"
}
```

#### 110. §3.7c · DELETE event-sources/:id — cleanup (with-state)

`DELETE /orgs/:id/event-sources/111` → **204** · request-id `0f855e40-9b04-441c-b81a-63a5a0944448` · 821 ms · raw `state/delete-event-source-with-state.json`

#### 111. §3.7 · GET /orgs/:id/event-sources/countries/US

`GET /orgs/:id/event-sources/countries/US` → **404** · request-id `4fd2b54a-301d-4f7e-b01c-d7390a31ccf3` · 444 ms

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### 112. §3.7 · GET /orgs/:id/event-sources/countries/US/states

`GET /orgs/:id/event-sources/countries/US/states` → **404** · request-id `c7968a74-4974-4918-be71-eb60857bd935` · 452 ms

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### 113. §3.7 · GET /orgs/:id/event-sources/states?country=US

`GET /orgs/:id/event-sources/states?country=US` → **400** · request-id `49ef6f4d-8df8-4b84-8fc3-20e9f5cace68` · 449 ms

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": [
      {
        "field": "id",
        "message": "must be a numeric id"
      }
    ],
    "requestId": "49ef6f4d-8df8-4b84-8fc3-20e9f5cace68"
  }
}
```

#### 114. §3.7 · GET /orgs/:id/event-sources/subdivisions?country=US

`GET /orgs/:id/event-sources/subdivisions?country=US` → **400** · request-id `ab47a511-6c62-4c12-9dca-1c7e7deac901` · 442 ms

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": [
      {
        "field": "id",
        "message": "must be a numeric id"
      }
    ],
    "requestId": "ab47a511-6c62-4c12-9dca-1c7e7deac901"
  }
}
```

#### 115. §3.7 · GET /orgs/:id/countries/US/states

`GET /orgs/:id/countries/US/states` → **404** · request-id `cb971b13-5b3d-40da-9791-bc0258e74ebf` · 443 ms

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### 116. §3.7 · GET /orgs/:id/states?country=US

`GET /orgs/:id/states?country=US` → **404** · request-id `7df12630-cc04-4ff5-b8f5-54ee62c335d9` · 543 ms

```json
{
  "error": {
    "code": "not_found",
    "message": "Not found"
  }
}
```

#### 117. §3.4 · GET /me/orgs — the funded owner’s orgs

`GET /me/orgs` → **200** · request-id `311fbe97-20c4-4849-854a-286072a5b02f` · 466 ms · raw `multi-asset/me-orgs.json`

```json
{
  "items": [
    {
      "id": "1813",
      "name": "QA Funded Org 1788440509919",
      "slug": "qa-funded-org-1788440509919",
      "status": "active",
      "role": "owner",
      "joinedAt": "2026-09-03T13:02:00.200Z"
    }
  ],
  "total": 1
}
```

#### 118. §3.4 · GET /orgs/1813/alphastudio/media/jobs — READ ONLY

`GET /orgs/1813/alphastudio/media/jobs` → **200** · request-id `bd52cb81-1d9e-44fa-84e5-4e290d9f2236` · 857 ms · raw `multi-asset/jobs-list.json`
> a list read on the funded org; never a POST there

```json
{
  "jobs": []
}
```

#### 119. cleanup · DELETE media/assets/masset_b24afbaa6bcb30f68af48c8e

`DELETE /orgs/:id/alphastudio/media/assets/masset_b24afbaa6bcb30f68af48c8e` → **204** · request-id `fc8b51c6-1cad-491f-a112-cd4053842d81` · 799 ms

#### 120. cleanup · DELETE media/assets/masset_392d87c15f41bfe946854a38

`DELETE /orgs/:id/alphastudio/media/assets/masset_392d87c15f41bfe946854a38` → **204** · request-id `e8637c87-72cd-4ed8-b410-7e5a4a3e1daf` · 786 ms

#### 121. cleanup · DELETE media/assets/masset_8ea12cc8634160529ee6834c

`DELETE /orgs/:id/alphastudio/media/assets/masset_8ea12cc8634160529ee6834c` → **204** · request-id `28a39329-5f74-4fe9-9d0d-910c0fff1a2d` · 781 ms

#### 122. cleanup · DELETE media/assets/masset_1508fa6f5391e767f91d2df2

`DELETE /orgs/:id/alphastudio/media/assets/masset_1508fa6f5391e767f91d2df2` → **204** · request-id `e845d3af-4cfa-48c4-a21a-0a0d2a45708c` · 794 ms

#### 123. cleanup · DELETE media/assets/masset_f8737222c97ea8030669bb3b

`DELETE /orgs/:id/alphastudio/media/assets/masset_f8737222c97ea8030669bb3b` → **204** · request-id `f22f6ae7-626a-46d3-815a-3976f103ec4d` · 816 ms

#### 124. cleanup · media/assets — list re-read

`GET /orgs/:id/alphastudio/media/assets` → **200** · request-id `f9da841a-ab85-409d-9b05-522fdd37bad8` · 761 ms · raw `after/assets.json`

```json
{
  "assets": []
}
```


### Motion supplement — the ladder one variable at a time, on org 1824 (2026-09-10)

Captured by `pnpm probe:hsn-0910 -- --motion-supplement --owner …` on an EXISTING zero-wallet
QA org (`qa+1789026912812hsn0910@alphapromena.com`) — no new org. Zero spend: four presigns with four free Node PUTs,
the rungs behind the zero-wallet shield (the wallet read 0 first), the wallet and the job
list re-read after, every asset deleted. Raw copy:
`Docs/qa/hsn-0910/phase0/supplement-motion/`. Run stamp: `2026-09-10T08:03:42.407Z`.

#### What the supplement established

- Supplement on the EXISTING QA org 1824 (qa+1789026912812hsn0910@alphapromena.com) — no new org.
- Wallet: 200 {"cents":0,"heldCents":0,"availableCents":0}.
- asset A (image/png): presign 201 → masset_13aa9b474ccb762af89220b5; PUT 200.
- 512 px PNG source: ffmpeg lavfi colour source, 512×512, 1900 bytes.
- asset C (image/png): presign 201 → masset_d9783f9d465e4018b0c911ad; PUT 200.
- 3 s MP4 source: ffmpeg lavfi colour source, 3 s, 64×64, 2384 bytes.
- asset V (video/mp4): presign 201 → masset_9ad934f231c04048092769cb; PUT 200.
- 5 s MP4 source: ffmpeg lavfi colour source, 5 s, 64×64, 2914 bytes.
- asset W (video/mp4): presign 201 → masset_418045b037f735053254ec4c; PUT 200.
- motion.generate · ladder-required-keys-only: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-1x1-still-5s-clip: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-512-still-3s-clip: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-1x1-still-3s-clip: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-orientation-video: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-plus-keepSound-prompt: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-plus-keepSound-false: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-plus-lang-en: 402 code=wallet_insufficient "The org's wallet cannot cover this request — not enough credits".
- motion.generate · ladder-plus-lang-ar: 400 code=bad_request "The media service rejected the request — check the body against the capability's schema".
- After the rungs: wallet {"cents":0,"heldCents":0,"availableCents":0}; jobs listed: 0.
- cleanup masset_13aa9b474ccb762af89220b5 (image/png): 204.
- cleanup masset_d9783f9d465e4018b0c911ad (image/png): 204.
- cleanup masset_9ad934f231c04048092769cb (video/mp4): 204.
- cleanup masset_418045b037f735053254ec4c (video/mp4): 204.
- cleanup list re-read: 200 {"assets":[]}.

#### Captured exchanges, in order

#### 1. supplement · GET /me/orgs — the owner’s org

`GET /me/orgs` → **200** · request-id `1ceca18a-13bf-4183-92b9-e85cdbc7212d` · 502 ms · raw `setup/me-orgs.json`

```json
{
  "items": [
    {
      "id": "1824",
      "name": "QA HSN-0910 Org 1789026912812",
      "slug": "qa-hsn-0910-org-1789026912812",
      "status": "active",
      "role": "owner",
      "joinedAt": "2026-09-10T07:55:21.368Z"
    }
  ],
  "total": 1
}
```

#### 2. supplement · wallet — the 402 shield

`GET /orgs/:id/alphastudio/wallet` → **200** · request-id `e45c694b-5466-4437-ba49-8d1ea26cddb1` · 3233 ms · raw `setup/wallet-shield.json`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

#### 3. asset A · media/assets/presign — image/png

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `6071d26e-169c-40ef-b01a-7d8018956323` · 817 ms · raw `setup/presign-A.json`

```json
{
  "request": {
    "mediaType": "image/png",
    "desc": "HSN-0910 motion supplement — a 1×1 still"
  }
}
```

```json
{
  "assetId": "masset_13aa9b474ccb762af89220b5",
  "uploadUrl": "<redacted url: 1673 chars>",
  "expiresAt": "2026-09-10T08:18:50.153Z",
  "mediaType": "image/png"
}
```

#### 4. asset A · PUT 70 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 548 ms

#### 5. asset C · media/assets/presign — image/png

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `866b54f9-0193-4763-b8aa-41b4d1882dcf` · 781 ms · raw `setup/presign-C.json`

```json
{
  "request": {
    "mediaType": "image/png",
    "desc": "HSN-0910 motion supplement — a 512×512 still"
  }
}
```

```json
{
  "assetId": "masset_d9783f9d465e4018b0c911ad",
  "uploadUrl": "<redacted url: 1673 chars>",
  "expiresAt": "2026-09-10T08:18:51.548Z",
  "mediaType": "image/png"
}
```

#### 6. asset C · PUT 1900 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 171 ms

#### 7. asset V · media/assets/presign — video/mp4

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `dbd5718e-088d-47ef-811e-d294c6e0143a` · 749 ms · raw `setup/presign-V.json`

```json
{
  "request": {
    "mediaType": "video/mp4",
    "desc": "HSN-0910 motion supplement — a 3-second clip"
  }
}
```

```json
{
  "assetId": "masset_9ad934f231c04048092769cb",
  "uploadUrl": "<redacted url: 1673 chars>",
  "expiresAt": "2026-09-10T08:18:52.523Z",
  "mediaType": "video/mp4"
}
```

#### 8. asset V · PUT 2384 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 176 ms

#### 9. asset W · media/assets/presign — video/mp4

`POST /orgs/:id/alphastudio/media/assets/presign` → **201** · request-id `d8958827-58b1-4d9b-8c11-fa7fbf04d628` · 735 ms · raw `setup/presign-W.json`

```json
{
  "request": {
    "mediaType": "video/mp4",
    "desc": "HSN-0910 motion supplement — a 5-second clip"
  }
}
```

```json
{
  "assetId": "masset_418045b037f735053254ec4c",
  "uploadUrl": "<redacted url: 1673 chars>",
  "expiresAt": "2026-09-10T08:18:53.488Z",
  "mediaType": "video/mp4"
}
```

#### 10. asset W · PUT 2914 bytes to the presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200** · request-id `none` · 180 ms

#### 11. supplement · media/jobs — motion.generate · ladder-required-keys-only

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `5de44fd0-8731-437e-a3dd-db8723454c7e` · 1191 ms · raw `jobs/ladder-required-keys-only.json`
> only capability, plan, image, video, orientation — the 512 px still and the 5 s clip; the control

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_d9783f9d465e4018b0c911ad",
    "video": "masset_418045b037f735053254ec4c",
    "orientation": "image"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "5de44fd0-8731-437e-a3dd-db8723454c7e"
  }
}
```

#### 12. supplement · media/jobs — motion.generate · ladder-1x1-still-5s-clip

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `bcc4fae0-1e48-4234-b744-a2cf3fe08769` · 863 ms · raw `jobs/ladder-1x1-still-5s-clip.json`
> required keys; the 1×1 still (under the 340 px floor) and the 5 s clip

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_13aa9b474ccb762af89220b5",
    "video": "masset_418045b037f735053254ec4c",
    "orientation": "image"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "bcc4fae0-1e48-4234-b744-a2cf3fe08769"
  }
}
```

#### 13. supplement · media/jobs — motion.generate · ladder-512-still-3s-clip

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `0ae7a7e2-fdce-4750-92b0-b3ebc88079ad` · 848 ms · raw `jobs/ladder-512-still-3s-clip.json`
> required keys; the 512 px still and the 3.0 s clip (at the 3 s floor)

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_d9783f9d465e4018b0c911ad",
    "video": "masset_9ad934f231c04048092769cb",
    "orientation": "image"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "0ae7a7e2-fdce-4750-92b0-b3ebc88079ad"
  }
}
```

#### 14. supplement · media/jobs — motion.generate · ladder-1x1-still-3s-clip

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `d88d58b7-3c45-415c-b786-84385e78ec07` · 835 ms · raw `jobs/ladder-1x1-still-3s-clip.json`
> required keys; run 1’s pair (org 1823): the 1×1 still and the 3.0 s clip

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_13aa9b474ccb762af89220b5",
    "video": "masset_9ad934f231c04048092769cb",
    "orientation": "image"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "d88d58b7-3c45-415c-b786-84385e78ec07"
  }
}
```

#### 15. supplement · media/jobs — motion.generate · ladder-orientation-video

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `45c0807d-01d4-47f5-bd61-70a00ff5a3d5` · 684 ms · raw `jobs/ladder-orientation-video.json`
> required keys with orientation "video"

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_d9783f9d465e4018b0c911ad",
    "video": "masset_418045b037f735053254ec4c",
    "orientation": "video"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "45c0807d-01d4-47f5-bd61-70a00ff5a3d5"
  }
}
```

#### 16. supplement · media/jobs — motion.generate · ladder-plus-keepSound-prompt

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `52a830bd-f0de-4939-b1b5-da0c37318cd0` · 1159 ms · raw `jobs/ladder-plus-keepSound-prompt.json`
> required keys plus keepSound true and prompt

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_d9783f9d465e4018b0c911ad",
    "video": "masset_418045b037f735053254ec4c",
    "orientation": "image",
    "keepSound": true,
    "prompt": "she keeps her warm, natural delivery; soft office light"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "52a830bd-f0de-4939-b1b5-da0c37318cd0"
  }
}
```

#### 17. supplement · media/jobs — motion.generate · ladder-plus-keepSound-false

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `b8f58226-9442-4d51-afd2-86e673578965` · 852 ms · raw `jobs/ladder-plus-keepSound-false.json`
> required keys plus keepSound false

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_d9783f9d465e4018b0c911ad",
    "video": "masset_418045b037f735053254ec4c",
    "orientation": "image",
    "keepSound": false
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "b8f58226-9442-4d51-afd2-86e673578965"
  }
}
```

#### 18. supplement · media/jobs — motion.generate · ladder-plus-lang-en

`POST /orgs/:id/alphastudio/media/jobs` → **402** · request-id `cc87be93-4c03-4213-8ce7-f326ad15610c` · 692 ms · raw `jobs/ladder-plus-lang-en.json`
> required keys plus lang "en" — is the key refused, or only "ar"?

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_d9783f9d465e4018b0c911ad",
    "video": "masset_418045b037f735053254ec4c",
    "orientation": "image",
    "lang": "en"
  }
}
```

```json
{
  "error": {
    "code": "wallet_insufficient",
    "message": "The org's wallet cannot cover this request — not enough credits",
    "requestId": "cc87be93-4c03-4213-8ce7-f326ad15610c"
  }
}
```

#### 19. supplement · media/jobs — motion.generate · ladder-plus-lang-ar

`POST /orgs/:id/alphastudio/media/jobs` → **400** · request-id `3f76fcab-6426-4620-8b02-609f8ffed5d0` · 661 ms · raw `jobs/ladder-plus-lang-ar.json`
> required keys plus lang "ar" — the document’s own value (refused in run 2)

```json
{
  "request": {
    "capability": "motion.generate",
    "plan": "balanced",
    "image": "masset_d9783f9d465e4018b0c911ad",
    "video": "masset_418045b037f735053254ec4c",
    "orientation": "image",
    "lang": "ar"
  }
}
```

```json
{
  "error": {
    "code": "bad_request",
    "message": "The media service rejected the request — check the body against the capability's schema",
    "requestId": "3f76fcab-6426-4620-8b02-609f8ffed5d0"
  }
}
```

#### 20. supplement · wallet — after the rungs

`GET /orgs/:id/alphastudio/wallet` → **200** · request-id `1a1f8ef9-c34e-4f2b-9293-19af36ec8b44` · 728 ms · raw `after/wallet.json`

```json
{
  "cents": 0,
  "heldCents": 0,
  "availableCents": 0
}
```

#### 21. supplement · media/jobs — list after (no job may exist)

`GET /orgs/:id/alphastudio/media/jobs` → **200** · request-id `a1007ef0-309a-41f2-9b0f-0570837a1533` · 933 ms · raw `after/jobs.json`

```json
{
  "jobs": []
}
```

#### 22. supplement · cleanup · DELETE media/assets/masset_13aa9b474ccb762af89220b5

`DELETE /orgs/:id/alphastudio/media/assets/masset_13aa9b474ccb762af89220b5` → **204** · request-id `a7083215-9373-40c9-b97b-cb71647ae62c` · 768 ms

#### 23. supplement · cleanup · DELETE media/assets/masset_d9783f9d465e4018b0c911ad

`DELETE /orgs/:id/alphastudio/media/assets/masset_d9783f9d465e4018b0c911ad` → **204** · request-id `f772ba8f-1bc3-4925-ba39-c12b4e3f5e21` · 756 ms

#### 24. supplement · cleanup · DELETE media/assets/masset_9ad934f231c04048092769cb

`DELETE /orgs/:id/alphastudio/media/assets/masset_9ad934f231c04048092769cb` → **204** · request-id `3e3e2c42-7c4e-4667-a0c0-4afabde21d40` · 762 ms

#### 25. supplement · cleanup · DELETE media/assets/masset_418045b037f735053254ec4c

`DELETE /orgs/:id/alphastudio/media/assets/masset_418045b037f735053254ec4c` → **204** · request-id `4689fc22-f4ef-4856-a086-3066e4e2f4c6` · 757 ms

#### 26. supplement · cleanup · media/assets — list re-read

`GET /orgs/:id/alphastudio/media/assets` → **200** · request-id `14be3218-2b8c-469e-bd9c-72a8ecff653a` · 728 ms · raw `after/assets.json`

```json
{
  "assets": []
}
```

