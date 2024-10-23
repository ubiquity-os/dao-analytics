import Link from "next/link";
import { Icon } from "../icons";
import SideMenu from "./side-menu";
import { getSupabase } from "@/app/lib/supabase/server-side";

//{ signIn, signOut }: { signIn: () => Promise<never>; signOut: () => Promise<never> }
export async function NavBar() {
  async function isLoggedIn() {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.getUser();
    return !error && !!data?.user;
  }

  const isUserLoggedIn = await isLoggedIn();

  return (
    <header className="fixed top-0 z-10 w-full p-4">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <header className="hidden gap-6 md:flex">
            <a href="/">
              <div id="logo">
                <div id="logo-icon">
                  <Icon name="logoIcon" />
                </div>
                <div id="logo-text">
                  <span>UbiquityOS</span> Org Insights
                </div>
              </div>
            </a>
          </header>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <SideMenu loggedIn={isUserLoggedIn} />
          </nav>
        </div>
      </div>
    </header>
  );
}
