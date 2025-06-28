import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(){
        return NextResponse.next();
    },
    {
        callbacks:{
            authorized : ({token, req})=>{
                const {pathname} = req.nextUrl
                //allow auth related paths
                if(
                    pathname.startsWith("/api/auth") ||
                    pathname === "/login" ||
                    pathname === "/register"
                ){
                    return true;
                }
                //public allowable urls
                if(pathname === "/" || pathname.startsWith("/api/videos")){
                    return true;
                }
                //else there is no token, so make it true
                return !!token;

            }
        }
    }
)
//paths where the middleware is to run
export const config = {
    matcher:  [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
} 