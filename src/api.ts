export async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  if (data?.error) throw new Error(data.error.info || data.error.code || JSON.stringify(data.error));
  return data;
}
