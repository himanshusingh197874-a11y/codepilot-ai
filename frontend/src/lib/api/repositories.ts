export async function getRepositoryInsights(id: string, token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/repositories/${id}/insights`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch repository insights");
  }

  return response.json();
}