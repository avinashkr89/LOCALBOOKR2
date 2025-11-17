import '@/styles/globals.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { AuthProvider } from '@/context/AuthContext'
import { BookingProvider } from '@/context/BookingContext'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <BookingProvider>
        <Component {...pageProps} />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BookingProvider>
    </AuthProvider>
  )
}

export default MyApp