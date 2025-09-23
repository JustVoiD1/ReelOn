import { Connection } from "mongoose"

declare global {
    var mongoose : {
        conn: Connection | null,
        promise: Promise | null
    }
}

export type VideoFormData = {
  title: string,
  description: string,
  videoUrl: string,
  thumbnailUrl: string
}

export{};