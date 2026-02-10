// And globalTeardown.js
export default async () => {
  await mongoose.disconnect();
};