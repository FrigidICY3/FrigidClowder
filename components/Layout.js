import Header from '../pages/others/header';
import Footer from '../pages/others/footer';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
