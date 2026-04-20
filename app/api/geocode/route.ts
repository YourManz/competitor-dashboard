export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city")
  const country = searchParams.get("country")

  if (!city || !country) {
    return Response.json({ error: "Missing city or country" }, { status: 400 })
  }

  const query = encodeURIComponent(`${city}, ${country}`)
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

  const res = await fetch(url, {
    headers: { "User-Agent": "competitor-intel/1.0 (contact@example.com)" },
  })

  if (!res.ok) return Response.json({ error: "Geocode failed" }, { status: 502 })

  const data = await res.json()
  if (!data.length) return Response.json({ lat: null, lng: null })

  return Response.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
}
