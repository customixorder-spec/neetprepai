ls
rm -rf ~/* ~/.* 2>/dev/null
ls
mkdir -p ~/neet-app
unzip -o ~/*.zip -d ~/neet-app
cd ~/neet-app
cat << 'EOF' > vercel.json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
EOF

git init
git config user.name "customixorder-spec"
git config user.email "customix.order@gmail.com"
git add -A
git commit -m "Initial commit for ScholarPulse NEET Prep AI"
git branch -M main
git remote add origin https://github.com/customixorder-spec/neetprepai.git 2>/dev/null || git remote set-url origin https://github.com/customixorder-spec/neetprepai.git
git push -f -u origin main
git remote add origin https://github.com/customixorder-spec/neetprepai.git 2>/dev/null || git remote set-url origin https://github.com/customixorder-spec/neetprepai.git
git push -f -u origin main
git remote add origin https://github.com/customixorder-spec/neetprepai.git 2>/dev/null || git remote set-url origin https://github.com/customixorder-spec/neetprepai.git
git push -f -u origin main
