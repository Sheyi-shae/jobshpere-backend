export const generatePassword = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '!@#$%^&*';
  const all = letters + numbers + specials;

  // Ensure at least one of each
  let password = '';
  password += letters.charAt(Math.floor(Math.random() * letters.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));

  // Fill the rest with random characters (min 6, max 8 here)
  const remainingLength = Math.floor(Math.random() * 3) + 3; // 3 to 5 more chars → total 6–8
  for (let i = 0; i < remainingLength; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }

  // Shuffle so guaranteed chars aren’t always at the front
  password = password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');

  return password;
};
