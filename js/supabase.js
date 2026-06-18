(function (window) {
    const CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js";

    const Supa = {
        client: null,
        inited: false,

        async _loadSdk() {
            if (window.supabase) return;

            return new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = CDN;
                script.async = true;

                script.onload = resolve;
                script.onerror = () =>
                    reject(new Error("Supabase SDK failed to load"));

                document.head.appendChild(script);
            });
        },

        async init(url, anonKey) {
            // allow using global config: window.SUPABASE_CONFIG = { url, anonKey }
            const cfg = window.SUPABASE_CONFIG || {};
            const u = url || cfg.url || window.SUPABASE_URL;
            const k = anonKey || cfg.anonKey || window.SUPABASE_ANON_KEY;

            if (!u || !k) throw new Error('Supabase url and anonKey required. See .env');

            await this._loadSdk();

            this.client = window.supabase.createClient(u, k);
            this.inited = true;

            return this.client;
        },

        _require() {
            if (!this.inited) {
                throw new Error("Supabase not initialized");
            }
        },

        async fetchAll(table) {
            this._require();
            const { data, error } = await this.client.from(table).select("*");
            if (error) throw error;
            return data;
        },

        async insert(table, rows) {
            this._require();
            const payload = Array.isArray(rows) ? rows : [rows];

            const { data, error } = await this.client
                .from(table)
                .insert(payload);

            if (error) throw error;
            return data;
        },

        async upsert(table, rows) {
            this._require();
            const payload = Array.isArray(rows) ? rows : [rows];

            const { data, error } = await this.client
                .from(table)
                .upsert(payload, { onConflict: "id" });

            if (error) throw error;
            return data;
        }
    };

    window.Supa = Supa;
})(window);