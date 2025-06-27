module.exports = {
  siteUrl: process.env.SITE_URL || 'https://famtriply.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/auth/*', '/api/*'],
}
