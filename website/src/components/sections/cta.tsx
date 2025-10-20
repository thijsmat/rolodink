export default function CTA() {
  return (
    <section className="py-24 px-8 bg-gradient-to-br from-azure to-azure/80 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-linkBlue/10 blur-3xl"></div>

      <div className="max-w-[896px] mx-auto relative z-10">
        <div className="text-center mb-8">
          <h2 className="font-playfair font-semibold text-5xl text-white mb-4">
            Klaar om je netwerk te versterken?
          </h2>
          <p className="text-xl text-white/80 max-w-[672px] mx-auto">
            Voeg vandaag nog Rolodink toe aan Chrome en begin met het opbouwen
            van betekenisvolle, persoonlijke professionele relaties.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button className="h-10 px-4 rounded-lg bg-white text-azure text-sm font-medium shadow-xl hover:bg-white/90 transition-colors flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.25333 14.6268L10.3067 9.3335"
                stroke="#1B2951"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.1133 5.3335H8"
                stroke="#1B2951"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.63333 4.04004L5.69333 9.33337"
                stroke="#1B2951"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 14.6668C11.6819 14.6668 14.6667 11.6821 14.6667 8.00016C14.6667 4.31826 11.6819 1.3335 8 1.3335C4.3181 1.3335 1.33334 4.31826 1.33334 8.00016C1.33334 11.6821 4.3181 14.6668 8 14.6668Z"
                stroke="#1B2951"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 10.6668C9.47276 10.6668 10.6667 9.47292 10.6667 8.00016C10.6667 6.5274 9.47276 5.3335 8 5.3335C6.52724 5.3335 5.33334 6.5274 5.33334 8.00016C5.33334 9.47292 6.52724 10.6668 8 10.6668Z"
                stroke="#1B2951"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Add to Chrome - Gratis
          </button>
          <button className="h-10 px-4 rounded-lg border-2 border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            Bekijk demo
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.33334 8H12.6667"
                stroke="white"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 3.3335L12.6667 8.00016L8 12.6668"
                stroke="white"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18ZM13.707 8.707C13.8892 8.5184 13.99 8.2658 13.9877 8.0036C13.9854 7.7414 13.8802 7.49059 13.6948 7.30518C13.5094 7.11977 13.2586 7.0146 12.9964 7.01233C12.7342 7.01005 12.4816 7.11084 12.293 7.293L9 10.586L7.707 9.293C7.5184 9.11084 7.2658 9.01005 7.0036 9.01233C6.7414 9.0146 6.49059 9.11977 6.30518 9.30518C6.11977 9.49059 6.0146 9.7414 6.01233 10.0036C6.01005 10.2658 6.11084 10.5184 6.293 10.707L8.293 12.707C8.48053 12.8945 8.73484 12.9998 9 12.9998C9.26516 12.9998 9.51947 12.8945 9.707 12.707L13.707 8.707Z"
                fill="#B8860B"
              />
            </svg>
            <span>Gratis te gebruiken</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18ZM13.707 8.707C13.8892 8.5184 13.99 8.2658 13.9877 8.0036C13.9854 7.7414 13.8802 7.49059 13.6948 7.30518C13.5094 7.11977 13.2586 7.0146 12.9964 7.01233C12.7342 7.01005 12.4816 7.11084 12.293 7.293L9 10.586L7.707 9.293C7.5184 9.11084 7.2658 9.01005 7.0036 9.01233C6.7414 9.0146 6.49059 9.11977 6.30518 9.30518C6.11977 9.49059 6.0146 9.7414 6.01233 10.0036C6.01005 10.2658 6.11084 10.5184 6.293 10.707L8.293 12.707C8.48053 12.8945 8.73484 12.9998 9 12.9998C9.26516 12.9998 9.51947 12.8945 9.707 12.707L13.707 8.707Z"
                fill="#B8860B"
              />
            </svg>
            <span>Privacy gegarandeerd</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34315C14.1566 2.84285 12.1217 2 10 2C7.87827 2 5.84344 2.84285 4.34315 4.34315C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34315 15.6569C5.84344 17.1571 7.87827 18 10 18ZM13.707 8.707C13.8892 8.5184 13.99 8.2658 13.9877 8.0036C13.9854 7.7414 13.8802 7.49059 13.6948 7.30518C13.5094 7.11977 13.2586 7.0146 12.9964 7.01233C12.7342 7.01005 12.4816 7.11084 12.293 7.293L9 10.586L7.707 9.293C7.5184 9.11084 7.2658 9.01005 7.0036 9.01233C6.7414 9.0146 6.49059 9.11977 6.30518 9.30518C6.11977 9.49059 6.0146 9.7414 6.01233 10.0036C6.01005 10.2658 6.11084 10.5184 6.293 10.707L8.293 12.707C8.48053 12.8945 8.73484 12.9998 9 12.9998C9.26516 12.9998 9.51947 12.8945 9.707 12.707L13.707 8.707Z"
                fill="#B8860B"
              />
            </svg>
            <span>Installatie in 30 seconden</span>
          </div>
        </div>
      </div>
    </section>
  );
}
