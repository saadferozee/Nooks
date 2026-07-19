import LogoutButton from "@/components/auth/LogoutButton";

export default function Home() {
  return (
    <div>
      <h1>this is homepage.</h1>
      <a href="/signup">click to SignUp</a>
      <LogoutButton />
    </div>
  );
}
