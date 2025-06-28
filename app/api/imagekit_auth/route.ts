import { getUploadAuthParams } from "@imagekit/next/server"

export async function GET() {
    try {
        // Check if required environment variables are present
        if (!process.env.PRIVATE_KEY || !process.env.NEXT_PUBLIC_PUBLIC_KEY) {
            return Response.json({ 
                error: "ImageKit credentials not configured" 
            }, { status: 500 })
        }

        const { token, expire, signature } = getUploadAuthParams({
            privateKey: process.env.PRIVATE_KEY as string,
            publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY as string,
        })

        return Response.json({ 
            token, 
            expire, 
            signature, 
            publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY 
        })
    } catch (error) {
        console.error("ImageKit auth error:", error)
        return Response.json({ 
            error: "Failed to generate ImageKit authentication parameters" 
        }, { status: 500 })
    }
}