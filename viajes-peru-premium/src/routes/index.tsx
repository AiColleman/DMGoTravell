import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Compass, Hotel, Landmark, Layers3, MapPin, Mountain, Search, ShieldCheck, Trees, Users, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DemoNote, HotelCard, SectionTitle, TourCard, todayISO } from '@/components/common/shared';
import { hotels, media, tours } from '@/mocks/data';
import { pageHead } from '@/app/routes';

export const Route = createFileRoute('/')({
  head: () => pageHead('Viajes por Perú, con identidad', 'Explora experiencias en Ayacucho, Cusco, Arequipa y Lima. Catálogo de demostración de DMGOTRAVEL.'),
  component: Home,
});

const destinations = [
  { name: 'Cusco', image: media.cusco, copy: 'Patrimonio inca y paisaje andino' },
  { name: 'Ayacucho', image: media.ayacucho, copy: 'Arte, memoria y tradición' },
  { name: 'Arequipa', image: media.arequipa, copy: 'Arquitectura entre volcanes' },
  { name: 'Lima', image: media.lima, copy: 'Cultura contemporánea y sabores' },
];

function Home() {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [travelers, setTravelers] = useState('2');
  const navigate = useNavigate();

  return <>
    <section className="hero-editorial">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><Compass size={14} />PERÚ, DESDE UNA NUEVA MIRADA</span>
          <h1>El viaje empieza<br />por un lugar que<br /><em>te mueve.</em></h1>
          <p>Experiencias para descubrir la cultura, la naturaleza y la identidad de Perú. Tú eliges el destino; nosotros ordenamos el recorrido.</p>
          <div className="button-row"><Button asChild size="lg"><Link to="/tours">Explorar experiencias<ArrowRight /></Link></Button><Button asChild variant="ghost" size="lg"><Link to="/about">Conocer DMGOTRAVEL</Link></Button></div>
          <div className="hero-footnote"><span>01</span><p>Catálogo de demostración<br />Ayacucho · Cusco · Arequipa · Lima</p></div>
        </div>
        <div className="hero-visual">
          <img src={media.peru} alt="Ciudadela de Machu Picchu entre montañas, Cusco" width={1280} height={853} />
          <span className="hero-location"><MapPin size={15} />Machu Picchu · Cusco</span>
        </div>
      </div>
    </section>
    <section className="search-section" aria-label="Buscar experiencias">
      <div className="container">
        <form className="search-box" onSubmit={(event) => { event.preventDefault(); navigate({ to: '/tours', search: { destination, date, travelers: Number(travelers), category: '' } }); }}>
          <div className="search-field"><MapPin /><label>Destino<select aria-label="Destino" value={destination} onChange={(event) => setDestination(event.target.value)}><option value="">Todos los destinos</option>{destinations.map((item) => <option key={item.name}>{item.name}</option>)}</select></label></div>
          <div className="search-field"><CalendarDays /><label>Fecha de viaje<input type="date" aria-label="Fecha de viaje" value={date} min={todayISO()} onChange={(event) => setDate(event.target.value)} /></label></div>
          <div className="search-field"><Users /><label>Viajeros<select aria-label="Viajeros" value={travelers} onChange={(event) => setTravelers(event.target.value)}>{[1, 2, 3, 4, 5, 6].map((number) => <option key={number} value={number}>{number} {number === 1 ? 'viajero' : 'viajeros'}</option>)}</select></label></div>
          <Button type="submit" size="lg"><Search />Buscar</Button>
        </form>
      </div>
    </section>
    <section className="section container">
      <SectionTitle eyebrow="DESTINOS" title="Cuatro formas de encontrarte con Perú" description="Lugares con identidad propia, reunidos en un catálogo editorial de demostración."><Link className="section-link" to="/tours" search={{ destination: '', category: '', date: '', travelers: 2 }}>Ver el catálogo<ArrowRight size={16} /></Link></SectionTitle>
      <div className="destinations-grid">{destinations.map((item, index) => <Link to="/tours" search={{ destination: item.name, category: '', date: '', travelers: 2 }} key={item.name} className={`destination ${index === 0 ? 'destination-featured' : ''} ${index === 3 ? 'destination-wide' : ''}`}><img src={item.image} alt={`${item.name}, Perú`} width={1280} height={960} loading="lazy" /><div><span>0{index + 1}</span><h3>{item.name}</h3><p>{item.copy}</p></div><ArrowRight /></Link>)}</div>
    </section>
    <section className="section section-muted">
      <div className="container"><SectionTitle eyebrow="EXPERIENCIAS SELECCIONADAS" title="Un recorrido para cada curiosidad" description="Propuestas de tours y paquetes con información clara antes de reservar." /><div className="cards-grid">{tours.slice(0, 3).map((tour) => <TourCard key={tour.id} tour={tour} />)}</div><DemoNote /></div>
    </section>
    <section className="section lodging-section">
      <div className="container"><SectionTitle eyebrow="ALOJAMIENTO OPCIONAL" title="Descansa cerca de lo que vienes a descubrir" description="Explora habitaciones y tarifas de demostración para complementar tu experiencia." /><div className="cards-grid">{hotels.slice(0, 3).map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}</div></div>
    </section>
  </>;
}
