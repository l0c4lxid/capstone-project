# Menggunakan image Node.js versi 18 sebagai dasar
FROM node:18

# Membuat direktori kerja untuk aplikasi
WORKDIR /usr/src/app

# Menyalin file package.json dan package-lock.json ke direktori kerja
COPY package*.json ./

# Menginstal dependensi aplikasi
RUN npm install

# Menyalin seluruh kode sumber ke direktori kerja
COPY . .

# Mengekspos port aplikasi (sesuaikan dengan port yang digunakan aplikasi Anda)
EXPOSE 3000

# Menjalankan aplikasi menggunakan npm run start
CMD [ "npm", "run", "start" ]
