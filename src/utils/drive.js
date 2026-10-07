export async function saveSubscriptions(token, subscriptions) {
  const res = await fetch("/api/save-subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ subscriptions }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Ошибка сервера");
  return data;
}
