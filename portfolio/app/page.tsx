import Cursor from './_components/Cursor';
import Hero from './_components/hero/Hero';
import CaseStudies from './_components/case/CaseStudies';
import Lab from './_components/lab/Lab';
import Shelf from './_components/shelf/Shelf';
import Essays from './_components/essays/Essays';
import Contact from './_components/Contact';

export default function Home() {
  return (
    <>
      <Cursor />
      <main>
        <Hero />
        <CaseStudies />
        <Lab />
        <Shelf />
        <Essays />
        <Contact />
      </main>
    </>
  );
}
