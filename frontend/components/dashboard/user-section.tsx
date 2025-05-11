import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function UserSection({ isCollapsed }: { isCollapsed?: boolean }) {
  const { user } = useUser();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`group flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:scale-105 relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full cursor-pointer`}>
          <Avatar className="h-5 w-5" >
            <AvatarImage src={user?.imageUrl || ""} alt={user?.firstName || ""} />
            <AvatarFallback>{user?.firstName?.[0] || ""}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <span className="truncate font-medium">{user?.firstName} {user?.lastName}</span>
              <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="p-4 border-b">
          <div className="text-xs text-muted-foreground mb-2">{user?.primaryEmailAddress?.emailAddress}</div>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.imageUrl || ""} alt={user?.firstName || ""} />
              <AvatarFallback>{user?.firstName?.[0] || ""}</AvatarFallback>
            </Avatar>
            <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
          </div>
        </div>
        <SignOutButton>
          <Button variant="ghost" className="w-full text-left px-4 py-3 hover:bg-accent transition text-destructive cursor-pointer">
            Logout
          </Button>
        </SignOutButton>
      </PopoverContent>
    </Popover>
  );
} 