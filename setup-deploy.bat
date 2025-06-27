@echo off
REM Setup script to prepare the project for deployment on Windows

REM Install node modules with correct flags
echo Installing dependencies...
call npm install --legacy-peer-deps

REM Add missing shadcn components if any
echo Installing shadcn/ui components...
call npx shadcn-ui@latest add card --yes
call npx shadcn-ui@latest add button --yes
call npx shadcn-ui@latest add alert --yes
call npx shadcn-ui@latest add dialog --yes
call npx shadcn-ui@latest add toast --yes
call npx shadcn-ui@latest add tabs --yes
call npx shadcn-ui@latest add select --yes
call npx shadcn-ui@latest add dropdown-menu --yes
call npx shadcn-ui@latest add popover --yes
call npx shadcn-ui@latest add label --yes
call npx shadcn-ui@latest add scroll-area --yes
call npx shadcn-ui@latest add input --yes
call npx shadcn-ui@latest add textarea --yes
call npx shadcn-ui@latest add progress --yes
call npx shadcn-ui@latest add badge --yes

REM Build the project
echo Building the project...
call npm run build

REM Run pre-deployment checks
echo Running pre-deployment checks...
call node check-deployment.js

echo Project is ready for deployment!
echo.
echo To deploy to Vercel, run: npm run deploy:vercel
echo To deploy to Netlify, run: npm run deploy:netlify

pause
