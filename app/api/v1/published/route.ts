import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // 1. Check if the external website is asking for a specific type (e.g., ?type=ranking)
    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get("type")

    // 2. Build the Supabase query: ONLY get "published" data
    let query = supabase
      .from("portal_data")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })

    // 3. Apply the filter if they asked for one
    if (filterType) {
      query = query.eq("type", filterType)
    }

    // 4. Fetch the data
    const { data, error } = await query

    if (error) throw error

    // 5. Send it back out to the internet as pure JSON
    return NextResponse.json({
      success: true,
      school: "Aivancity Paris-Cachan",
      total_results: data ? data.length : 0,
      data: data,
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}