import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Icon } from "../icons";
import { getUser } from "@/app/lib/supabase/server-side";

// Secure Context
export default async function UserAvatar() {
  const user = await getUser();
  if (!user) {
    return (
      <Avatar>
        <Icon name="logoIcon" className="opacity-50" />
      </Avatar>
    );
  }

  return (
    <Avatar>
      <AvatarImage src={user.user_metadata.avatar_url} />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}
