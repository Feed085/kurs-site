const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const { verifyGoogleCredential } = require('../utils/googleAuth');

const parseExperience = (value) => {
  const experience = Number(value);
  return Number.isFinite(experience) ? experience : 0;
};

// Token gönder fonksiyonu
const sendTokenResponse = (teacher, statusCode, res) => {
  const token = teacher.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token, // Frontend bu tokeni localStorage'a kaydedecek
    teacher: {
      id: teacher._id,
      name: teacher.name,
      surname: teacher.surname,
      email: teacher.email,
      avatar: teacher.avatar || '',
      role: teacher.role,
      categories: teacher.categories,
      rating: teacher.rating,
      education: teacher.education,
      experience: parseExperience(teacher.experience),
      specializedAreas: teacher.specializedAreas,
      location: teacher.location
    }
  });
};

// @desc    Öğretmen Kaydet (Register)
// @route   POST /api/teacher/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('=== TEACHER REGISTER BAŞLADI ===');
    console.log('Gelen Request Body:', JSON.stringify(req.body, null, 2));
    
    const { name, surname, email, password, phoneNumber, categories, education, experience, specializedAreas, location, socialNetworks } = req.body;

    console.log('Parse edilmiş değişkenler:', {
      name,
      surname,
      email,
      phoneNumber,
      categories,
      education,
      experience,
      specializedAreas,
      location,
      socialNetworks
    });

    // Zorunlu alanları kontrol et
    if (!name || !surname || !email || !password) {
      console.log('Zorunlu alanlar eksik:', { name, surname, email, passwordExists: !!password });
      return res.status(400).json({ success: false, message: 'Ad, Soyad, Email ve Şifre zorunludur' });
    }

    // Email önceden kullanılmış mı kontrol et
    console.log('Email kontrolü başlanıyor:', email);
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      console.log('Email zaten mevcut:', email);
      return res.status(400).json({ success: false, message: 'Bu email ile kayıtlı bir öğretmen zaten var.' });
    }
    console.log('Email uygun, yeni öğretmen oluşturma başlıyor...');

    // Yeni Öğretmen oluştur
    console.log('Teacher.create çağrılıyor...');
    const teacher = await Teacher.create({
      name,
      surname,
      email,
      password,
      initialPassword: password,
      phoneNumber,
      categories,
      education,
      experience: parseExperience(experience),
      specializedAreas,
      location,
      socialNetworks
    });

    console.log('Öğretmen başarıyla oluşturuldu:', teacher._id);
    sendTokenResponse(teacher, 201, res);
  } catch (error) {
    console.error('=== TEACHER REGISTER HATA ===');
    console.error('Hata Mesajı:', error.message);
    console.error('Hata Adı:', error.name);
    console.error('Hata Stack:', error.stack);
    
    // Mongoose Validation Hatası
    if (error.name === 'ValidationError') {
      console.error('Mongoose Validation Hatası Detayları:', error.errors);
      const messages = Object.entries(error.errors).map(([key, err]) => `${key}: ${err.message}`).join(', ');
      return res.status(400).json({ success: false, message: 'Doğrulama Hatası', errors: messages });
    }
    
    // Mongoose Duplicate Key Hatası
    if (error.code === 11000) {
      console.error('Duplicate Key Hatası:', error.keyPattern);
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `${field} zaten kullanımda` });
    }
    
    console.error('Tam Hata Nesnesi:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Öğretmen Google Girişi
// @route   POST /api/teacher/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body || {};

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential tələb olunur' });
    }

    const payload = await verifyGoogleCredential(credential);
    const email = (payload?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(401).json({ success: false, message: 'Google hesab email-i tapılmadı' });
    }

    if (!payload?.email_verified) {
      return res.status(401).json({ success: false, message: 'Google email təsdiqlənməyib' });
    }

    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Bu e-poçt ilə qeydiyyatdan keçmiş müəllim tapılmadı. Əvvəlcə hesab yaradın.',
      });
    }

    sendTokenResponse(teacher, 200, res);
  } catch (error) {
    console.error('Teacher Google login failed:', error);
    const statusCode = error?.statusCode || 401;
    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Google girişi uğursuz oldu',
    });
  }
};

// @desc    Öğretmen Girişi (Login)
// @route   POST /api/teacher/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('=== TEACHER LOGIN BAŞLADI ===');
    console.log('Gelen Request Body:', JSON.stringify(req.body, null, 2));
    
    const { email, password } = req.body;

    // Email ve şifre girilmiş mi?
    if (!email || !password) {
      console.log('Email veya şifre boş:', { email: !!email, password: !!password });
      return res.status(400).json({ success: false, message: 'Lütfen email ve şifre giriniz.' });
    }

    // Öğretmeni veritabanında ara
    console.log('Öğretmen aranıyor:', email);
    const teacher = await Teacher.findOne({ email }).select('+password'); // Şifreyi de çek

    if (!teacher) {
      console.log('Öğretmen bulunamadı:', email);
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    console.log('Öğretmen bulundu, şifre kontrol ediliyor...');
    // Şifreler eşleşiyor mu?
    const isMatch = await teacher.matchPassword(password);

    if (!isMatch) {
      console.log('Şifre eşleşmiyor');
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    console.log('Login başarılı');
    sendTokenResponse(teacher, 200, res);
  } catch (error) {
    console.error('=== TEACHER LOGIN HATA ===');
    console.error('Hata Mesajı:', error.message);
    console.error('Hata Stack:', error.stack);
    res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
  }
};
