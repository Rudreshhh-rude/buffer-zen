import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabase';

export default function AuthPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
                <h1 className="text-white text-2xl font-bold mb-6 text-center">
                    BUFFER<span className="text-emerald-500">ZEN</span>
                </h1>

                <Auth
                    supabaseClient={supabase}
                    providers={['google']}
                    theme="dark"
                    appearance={{ theme: ThemeSupa }}
                />
            </div>
        </div>
    );
}
