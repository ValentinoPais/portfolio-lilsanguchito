/* Config de la web: lo único que se toca en el código para conectarla.
   google: la API key del proyecto de Google Cloud (restringida a la dirección de la web y a YouTube Data,
   Sheets y Drive) y el ID de la planilla (lo que va entre /d/ y /edit en su dirección). Con las dos, la web
   lee los trabajos y la config de la planilla, y los datos de YouTube, Drive y TikTok (js/data.js). Vacías,
   usa los datos de ejemplo.
   Todo lo demás se cambia en la planilla, sin tocar la web: en Trabajos, los links; en Config, el título y
   los links de la barra y el canal de arriba (foto, nombre, @, descripción y redes).
   mock: la config de ejemplo, con la misma forma que la que arma la web con la pestaña Config. La barra:
   title y links (cada uno: id, label, url y, si hace falta, icon, la URL de otro ícono). El canal: photo,
   name, handle (@...: de ahí YouTube trae los suscriptores; los videos son los trabajos de la página),
   description (los renglones en blanco separan párrafos) y links (las redes: id, label y url; un mail, mailto:). */
window.SITE_CONFIG = {
  google: {
    apiKey: '',    // ← la API key
    sheetId: ''    // ← el ID de la planilla
  },
  mock: {
    title: 'Sanguchito',   // el título de la barra de arriba
    links: [
      { id: 'discord', label: 'Discord', url: 'https://discord.gg/lilsanguchito', icon: '' },
      { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/lilsanguchito/', icon: '' },
      { id: 'canal', label: 'Canal de YouTube', url: 'https://www.youtube.com/@lilsanguchito', icon: '' }
    ],
    channel: {   // el encabezado de arriba de todo
      photo: 'assets/mock/avatars/lilsanguchito.jpg',
      name: 'Lil Sanguchito',
      handle: '@LilSanguchito',
      description: 'Soy Lil Sanguchito, editor de video de Buenos Aires. Edito desde 2016 y trabajo desde 2019 con youtubers, streamers y marcas: vlogs, gameplay, cortes de stream, shorts y publicidad.\n\nMe formé en edición audiovisual en el Centro de Formación Profesional N.º 24 y en cine. Me importa el ritmo: que el video se entienda, que tenga humor cuando hace falta y que la gente lo mire hasta el final.',
      links: [
        { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/lilsanguchito/' },
        { id: 'discord', label: 'Discord', url: 'https://discord.gg/lilsanguchito' },
        { id: 'mail', label: 'hola@lilsanguchito.com.ar', url: 'mailto:hola@lilsanguchito.com.ar' }
      ]
    }
  }
};
