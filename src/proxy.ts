import {oryConfig} from "@/lib/ory/ory.config";
import { createOryMiddleware } from "@ory/nextjs/middleware"


export const middleware = createOryMiddleware(oryConfig)

// See "Matching Paths" below to learn more
export const config = {}

export default middleware
