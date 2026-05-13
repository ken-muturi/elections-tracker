import { createRequire } from "module"
import { readFileSync } from "fs"
import { S3Client, ListBucketsCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Manually load .env
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=")
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const s3 = new S3Client({
  region: env.AWS_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: env.S3_AWS_ACCESS_KEY,
    secretAccessKey: env.S3_AWS_SECRET_ACCESS_KEY,
  },
})

console.log("Region:", env.AWS_S3_REGION)
console.log("Bucket:", env.AWS_S3_BUCKET)
console.log("Bucket URL:", env.AWS_S3_BUCKET_URL)

// 1. List buckets
try {
  const result = await s3.send(new ListBucketsCommand({}))
  console.log("\nBuckets in this AWS account:")
  result.Buckets?.forEach((b) => console.log(" -", b.Name))
  if (!result.Buckets?.length) console.log("  (no buckets)")
} catch (e) {
  console.error("❌ ListBuckets failed:", e.message)
}

// 2. Test presigned upload
try {
  const cmd = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: "form-images/upload-test.txt",
    ContentType: "text/plain",
  })
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 })
  console.log("\nPresigned URL generated OK:", url.split("?")[0])

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: "test upload",
  })
  if (res.ok) {
    console.log("✅ PUT succeeded — S3 upload works!")
    console.log("  Final URL:", env.AWS_S3_BUCKET_URL + "form-images/upload-test.txt")
  } else {
    const body = await res.text()
    console.error("❌ PUT failed, HTTP", res.status)
    console.error(body.slice(0, 600))
  }
} catch (e) {
  console.error("❌ Upload test failed:", e.message)
}
