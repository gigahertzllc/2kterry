import { ArrowLeft, Download, FolderOpen, FileArchive, CheckCircle, AlertTriangle, Monitor, HardDrive } from 'lucide-react';

interface InstallGuidePageProps {
  onNavigate: (page: string) => void;
}

export function InstallGuidePage({ onNavigate }: InstallGuidePageProps) {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Back button */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Article Header */}
        <div className="mb-12">
          <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full mb-4">
            GUIDE
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent leading-tight">
            How to Install Cyberface Mods in NBA 2K on PC
          </h1>
          <p className="text-gray-400 text-lg">
            A complete step-by-step guide to installing cyberface packs and other mods for NBA 2K25 and 2K26 on PC.
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span>By 2K Terry</span>
            <span>·</span>
            <span>Updated March 2026</span>
            <span>·</span>
            <span>5 min read</span>
          </div>
        </div>

        {/* Article Body */}
        <article className="prose prose-invert max-w-none">

          {/* What You Need */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white m-0">What You Need Before Starting</h2>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 m-0"><strong className="text-white">NBA 2K25 or 2K26 for PC</strong> — installed via Steam or the 2K Launcher. This guide does not apply to console versions.</p>
              </div>
              <div className="flex items-start gap-3">
                <FileArchive className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 m-0"><strong className="text-white">A file extraction tool</strong> — WinRAR or 7-Zip (free). You'll need this to unzip the mod files.</p>
              </div>
              <div className="flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 m-0"><strong className="text-white">Enough disk space</strong> — Cyberface packs can range from a few MB to several hundred MB depending on the pack size.</p>
              </div>
            </div>
          </section>

          {/* Step 1 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 font-bold">1</span>
              </div>
              <h2 className="text-2xl font-bold text-white m-0">Download Your Mod Pack</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Head to the <button onClick={() => onNavigate('shop')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 bg-transparent border-none cursor-pointer p-0 text-base">Mods page</button> and find the pack you want. Click the download button — for free packs, the download starts immediately. For paid packs, you'll complete a quick checkout first, then get instant access to your download.
              </p>
              <p>
                The file you download will be a <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">.zip</code> archive. Save it somewhere easy to find, like your Desktop or Downloads folder.
              </p>
            </div>
          </section>

          {/* Step 2 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-white m-0">Extract the Files</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Right-click the downloaded <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">.zip</code> file and select <strong className="text-white">"Extract All"</strong> (Windows built-in) or <strong className="text-white">"Extract Here"</strong> if you have 7-Zip or WinRAR installed.
              </p>
              <p>
                After extracting, you should see one or more <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">.iff</code> files inside. These are the actual cyberface textures that the game reads. Some packs may also include a README or instruction file — always read those if present.
              </p>
            </div>
          </section>

          {/* Step 3 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 font-bold">3</span>
              </div>
              <h2 className="text-2xl font-bold text-white m-0">Locate Your NBA 2K Mods Folder</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                You need to find the mods folder inside your NBA 2K installation. The typical paths are:
              </p>
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 space-y-3 font-mono text-sm">
                <div>
                  <span className="text-gray-500 text-xs block mb-1">Steam (NBA 2K26):</span>
                  <p className="text-orange-300 m-0">C:\Program Files (x86)\Steam\steamapps\common\NBA 2K26\mods</p>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <span className="text-gray-500 text-xs block mb-1">Steam (NBA 2K25):</span>
                  <p className="text-orange-300 m-0">C:\Program Files (x86)\Steam\steamapps\common\NBA 2K25\mods</p>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <span className="text-gray-500 text-xs block mb-1">2K Launcher:</span>
                  <p className="text-orange-300 m-0">C:\2K Games\NBA 2K26\mods</p>
                </div>
              </div>
              <p>
                If the <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">mods</code> folder doesn't exist yet, just create it yourself inside the game's root directory.
              </p>
              <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4 flex items-start gap-3">
                <FolderOpen className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 m-0 text-sm">
                  <strong className="text-blue-300">Tip:</strong> If you installed Steam to a custom location or a different drive, your path will be different. In Steam, right-click NBA 2K → Properties → Local Files → Browse to quickly find it.
                </p>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 font-bold">4</span>
              </div>
              <h2 className="text-2xl font-bold text-white m-0">Copy the Mod Files</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Copy all the extracted <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">.iff</code> files (and any subfolders if the pack includes them) into the <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">mods</code> folder you found in Step 3.
              </p>
              <p>
                That's it — just drag and drop or copy-paste. The game engine automatically scans this folder when it loads, so the cyberfaces will be applied to the matching players.
              </p>
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 m-0 text-sm">
                  <strong className="text-amber-300">Important:</strong> If you're replacing an existing cyberface for the same player, the new file will overwrite the old one. Consider making a backup of any existing files first if you want to be able to revert.
                </p>
              </div>
            </div>
          </section>

          {/* Step 5 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-400 font-bold">5</span>
              </div>
              <h2 className="text-2xl font-bold text-white m-0">Launch the Game and Verify</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Start NBA 2K as you normally would. Once in-game, head to a mode where you can see the players whose cyberfaces you installed — Play Now, MyNBA, or even just the roster screen.
              </p>
              <p>
                The new faces should load automatically. If a particular player still shows the default face, double-check that the file name matches what the game expects and that it's in the correct folder.
              </p>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white m-0">Troubleshooting</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">Mod isn't showing up in-game</h3>
                <p className="text-gray-300 text-sm m-0">
                  Make sure the files are directly inside the <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">mods</code> folder, not nested inside an extra subfolder from the extraction. The path should look like <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">...\mods\player_name.iff</code>, not <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">...\mods\pack-folder\player_name.iff</code>.
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">Game crashes on startup after installing mods</h3>
                <p className="text-gray-300 text-sm m-0">
                  This is rare but can happen if a file is corrupted or incompatible with your game version. Remove the most recently added files from the mods folder and try again. Make sure you're using mods made for your specific game version (2K25 vs 2K26).
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">Wrong face on the wrong player</h3>
                <p className="text-gray-300 text-sm m-0">
                  Cyberface files are linked to specific player IDs in the game's database. If a face shows up on the wrong player, the file may have been named for a different roster version. Check the pack's included README for any roster-specific notes.
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">How to uninstall a mod</h3>
                <p className="text-gray-300 text-sm m-0">
                  Simply delete the mod files from the <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-300 text-sm">mods</code> folder. The game will revert to the default assets on the next launch. No registry changes or uninstallers needed.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 border-t border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-6">Browse our collection of free and premium cyberface packs.</p>
            <button
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all text-white font-semibold"
            >
              <Download className="w-5 h-5" />
              Browse Mods
            </button>
          </section>
        </article>
      </div>
    </div>
  );
}
