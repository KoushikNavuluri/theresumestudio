import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to get their ID
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin role using has_role function
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify admin status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasAdminRole) {
      console.log("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...payload } = await req.json();
    console.log("Admin action:", action, "by user:", user.id);

    switch (action) {
      case "check-admin": {
        return new Response(
          JSON.stringify({ isAdmin: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        const { data: codes, error } = await supabase
          .from("bonus_codes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ codes }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        const { code, credits, max_uses, expires_at } = payload;

        // Validation
        if (!code || typeof code !== "string" || code.length < 3 || code.length > 20) {
          return new Response(
            JSON.stringify({ error: "Code must be 3-20 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!credits || credits < 1 || credits > 10000) {
          return new Response(
            JSON.stringify({ error: "Credits must be between 1 and 10000" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("bonus_codes")
          .insert({
            code: code.toUpperCase().replace(/[^A-Z0-9]/g, ""),
            credits,
            max_uses: max_uses || 1,
            expires_at: expires_at || null,
            is_active: true,
            uses: 0,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return new Response(
              JSON.stringify({ error: "A code with this name already exists" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw error;
        }

        console.log("Created promo code:", data.code);
        return new Response(
          JSON.stringify({ code: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const { id, ...updates } = payload;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Code ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Sanitize updates
        const allowedFields = ["credits", "max_uses", "expires_at", "is_active"];
        const sanitizedUpdates: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (key in updates) {
            sanitizedUpdates[key] = updates[key];
          }
        }

        const { data, error } = await supabase
          .from("bonus_codes")
          .update(sanitizedUpdates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        console.log("Updated promo code:", id);
        return new Response(
          JSON.stringify({ code: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deactivate": {
        const { id } = payload;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Code ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("bonus_codes")
          .update({ is_active: false })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        console.log("Deactivated promo code:", id);
        return new Response(
          JSON.stringify({ code: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "activate": {
        const { id } = payload;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Code ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("bonus_codes")
          .update({ is_active: true })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        console.log("Activated promo code:", id);
        return new Response(
          JSON.stringify({ code: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { id } = payload;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Code ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("bonus_codes")
          .delete()
          .eq("id", id);

        if (error) throw error;

        console.log("Deleted promo code:", id);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
        // Get total codes
        const { count: totalCodes } = await supabase
          .from("bonus_codes")
          .select("*", { count: "exact", head: true });

        // Get active codes
        const { count: activeCodes } = await supabase
          .from("bonus_codes")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Get all codes for sum calculations
        const { data: allCodes } = await supabase
          .from("bonus_codes")
          .select("uses, credits");

        const totalRedemptions = allCodes?.reduce((sum, c) => sum + (c.uses || 0), 0) || 0;

        // Get redeemed codes for credits distributed
        const { data: redeemed } = await supabase
          .from("redeemed_codes")
          .select("credits_awarded, created_at, user_id, bonus_code_id");

        const creditsDistributed = redeemed?.reduce((sum, r) => sum + r.credits_awarded, 0) || 0;

        // Get top codes by redemptions
        const { data: topCodes } = await supabase
          .from("bonus_codes")
          .select("code, uses, credits")
          .order("uses", { ascending: false })
          .limit(5);

        // Get recent redemptions with user emails
        const { data: recentRedemptions } = await supabase
          .from("redeemed_codes")
          .select(`
            id,
            created_at,
            credits_awarded,
            user_id,
            bonus_code_id
          `)
          .order("created_at", { ascending: false })
          .limit(20);

        // Get user emails and code names for recent redemptions
        const enrichedRedemptions = [];
        if (recentRedemptions) {
          for (const redemption of recentRedemptions) {
            // Get user email from auth.users
            const { data: userData } = await supabase.auth.admin.getUserById(redemption.user_id);
            
            // Get code name
            const { data: codeData } = await supabase
              .from("bonus_codes")
              .select("code")
              .eq("id", redemption.bonus_code_id)
              .single();

            enrichedRedemptions.push({
              ...redemption,
              user_email: userData?.user?.email || "Unknown",
              code_name: codeData?.code || "Unknown",
            });
          }
        }

        return new Response(
          JSON.stringify({
            stats: {
              totalCodes: totalCodes || 0,
              activeCodes: activeCodes || 0,
              totalRedemptions,
              creditsDistributed,
              topCodes: topCodes || [],
              recentRedemptions: enrichedRedemptions,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Admin promo codes error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
