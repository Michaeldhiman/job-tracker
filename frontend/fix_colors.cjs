const fs = require('fs');
let content = fs.readFileSync('src/pages/LandingPage.jsx', 'utf8');

// Replacements
content = content.replaceAll('bg-[#050505]', 'bg-background');
content = content.replaceAll('bg-[#121214]', 'bg-surface');
content = content.replaceAll('bg-[#09090b]', 'bg-background');
content = content.replaceAll('text-white', 'text-text');
content = content.replaceAll('border-white/5', 'border-border');
content = content.replaceAll('border-white/10', 'border-border');
content = content.replaceAll('bg-white/5', 'bg-surface-elevated');
content = content.replaceAll('bg-white/10', 'bg-surface-elevated hover:bg-surface');
content = content.replaceAll('hover:text-white', 'hover:text-text');

// Revert button text colors back to white where they are on primary background
content = content.replaceAll('bg-primary hover:bg-primary-hover shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm font-medium text-text', 'bg-primary hover:bg-primary-hover shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm font-medium text-white');
content = content.replaceAll('bg-primary hover:bg-primary-hover shadow-[0_0_30px_rgba(79,70,229,0.4)] text-text', 'bg-primary hover:bg-primary-hover shadow-[0_0_30px_rgba(79,70,229,0.4)] text-white');
content = content.replaceAll('bg-primary text-center font-medium text-text', 'bg-primary text-center font-medium text-white');
content = content.replaceAll('<Briefcase className="w-4 h-4 text-text" />', '<Briefcase className="w-4 h-4 text-white" />');
content = content.replaceAll('<CheckCircle2 className="w-4 h-4 text-text" />', '<CheckCircle2 className="w-4 h-4 text-white" />');
content = content.replaceAll('text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400', 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500');

fs.writeFileSync('src/pages/LandingPage.jsx', content);
console.log('Replacements done');
