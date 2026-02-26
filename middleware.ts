import { NextResponse } from "next/server";

export function middleware(req:any){

  const token =
    req.cookies.get("sb-access-token");

  if(!token &&
     !req.nextUrl.pathname.startsWith("/signin")
  ){
      return NextResponse.redirect(
        new URL("/signin",req.url)
      );
  }

  return NextResponse.next();
}