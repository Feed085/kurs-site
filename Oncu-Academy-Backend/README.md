# Oncu-Academy-Backend

## Numune seed

Backend terefde esas mehsul axinlarini numune melumatlarla dolduran tekrar ishledile bilen bir seed komandasi var.

Bu qovluqdan ishledin:

```bash
npm run demo:seed
```

Skript asagidaki numune qeydleri yeniden yaradir:

- 5 muellim hesabi
- 10 telebe hesabi
- 12 yayimlanmis kurs
- kurs videolari ve modullari
- kurs testleri, muellim qaralama testleri ve 1 admin imtahani
- telebe irelileyisi, tamamlanmis test neticeleri, sertifikatlar ve reyler

Seed edilmis muellim ve telebe hesablarinin login sifresi:

```text
Demo123!
```

Numune muellim hesabi:

```text
demo.teacher.leyla@sizinakademiyaniz.com
```

Numune telebe hesabi:

```text
demo.student.amin@sizinakademiyaniz.com
```

Qeydler:

- Skript yalniz numune ile isharelenmis muellim, telebe, kurs ve test qeydlerini silib yeniden yaradir.
- Kateqoriyalar upsert olunur ve yeniden istifade edilir.
- Admin girisi hele de movcud Google icaze siyahisi axini ile ishleyir; bu skript admin ekranlari ucun melumat yaradir, amma ayri admin sifresi ile giris yaratmir.
