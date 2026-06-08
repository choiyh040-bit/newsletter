const google = require('googlethis');

async function test() {
  try {
    const images = await google.image('modern office working people', { safe: false });
    console.log(images.slice(0, 3));
  } catch (err) {
    console.error(err);
  }
}
test();
