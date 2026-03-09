import { motion } from 'framer-motion';

function Login({ onDemoLogin }) {
  return (
    <div className="min-h-screen bg-buf-bg flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-buf-cyan/5 blur-[100px] pointer-events-none rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 rounded-2xl w-full max-w-sm relative"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-buf-cyan mx-auto rounded-xl flex items-center justify-center relative shadow-[0_0_20px_rgba(13,242,201,0.3)] mb-6">
            <div className="absolute inset-1.5 border-2 border-buf-bg rounded-lg"></div>
            <div className="w-2.5 h-2.5 bg-buf-bg rounded-sm mx-auto z-10"></div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">BufferZen</h1>
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Authentication Gateway</p>
        </div>

        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDemoLogin}
            className="w-full bg-white text-stone-950 font-black text-[11px] uppercase tracking-widest py-4 rounded-xl hover:bg-stone-200 transition-colors duration-300 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            <div className="w-4 h-4 rounded-full bg-buf-cyan flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-buf-bg"></div>
            </div>
            ENTER DASHBOARD
          </motion.button>

        </div>
      </motion.div>
    </div>
  );
}

export default Login;
