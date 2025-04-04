"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SessionButton() {
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };


  if (!session?.user) {
    return (
      <Link href="/api/auth/signin?provider=github">
        <Button variant="outline" className="gap-2">
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              {getInitials(session.user.name ?? "")}
            </AvatarFallback>
          </Avatar>
          {session.user.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/api/auth/signout" className="cursor-pointer">
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
