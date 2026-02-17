"use client";

import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["test-api"],
    queryFn: async () => {
      const res = await fetch("http://localhost:3000");
      const data = await res.json();
      console.log(data);
      return data;
    },
    enabled: false,
    retry: false,
  });

  const handleClick = () => {
    console.log("Test");
    refetch();
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      Hey, Madhu
      <button onClick={handleClick}>Test</button>
    </div>
  );
}
