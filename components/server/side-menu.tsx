import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "./user-avatar";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SubmitButton } from "../client/submit-button";

export default function SideMenu({ loggedIn, signIn, signOut }: { loggedIn: boolean; signIn: () => Promise<never>; signOut: () => Promise<never> }) {
  const menuItems = [
    {
      label: "Account",
      children: loggedIn
        ? [
            { label: "Profile", href: "/account" },
            { label: "Logout", action: signOut },
          ]
        : [{ label: "Login", action: signIn }],
    },
    {
      label: "Navigation",
      children: [
        { label: "Home", href: "/" },
        { label: "Claims", href: "/claim" },
        { label: "Account", href: "/account" },
      ],
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="items-center bg-[#333] text-white">
        {menuItems.map((item, i) => (
          <div key={item.label + i}>
            {item.children.length && (
              <>
                <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                <DropdownMenuSeparator className="border-t border-[#555]" />
              </>
            )}
            {item.children.map((child) => (
              <>
                {child.action ? (
                  <form key={child.label} className="ml-2">
                    {loggedIn ? (
                      <SubmitButton pendingText="Signing Out..." formAction={signOut}>
                        <ChevronRight className="w-6 h-6 " />
                        <DropdownMenuItem className="flex items-center gap-2">Sign Out</DropdownMenuItem>
                      </SubmitButton>
                    ) : (
                      <SubmitButton pendingText="Signing In..." formAction={signIn}>
                        <ChevronRight className="w-6 h-6 " />
                        <DropdownMenuItem className="flex items-center gap-2">Sign In</DropdownMenuItem>
                      </SubmitButton>
                    )}
                  </form>
                ) : (
                  <Link
                    href={child.href}
                    key={child.label}
                    className="w-full align-middle items-center flex gap-1 cursor-pointer hover:bg-[#444]  hover:text-white text-[#999]"
                  >
                    <ChevronRight className="w-6 h-6 " />
                    <DropdownMenuItem className="flex items-center gap-2">{child.label}</DropdownMenuItem>
                  </Link>
                )}
              </>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
