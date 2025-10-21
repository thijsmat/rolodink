const useCases = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 20V4C16 3.46957 15.7893 2.96086 15.4142 2.58579C15.0391 2.21071 14.5304 2 14 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4V20" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 6H4C2.89543 6 2 6.89543 2 8V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6Z" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Recruiters",
    description: "Track candidate details and follow-ups",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 7H22V13" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 7L13.5 15.5L8.5 10.5L2 17" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Sales professionals",
    description: "Remember client preferences and conversations",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.12793C16.8578 3.3503 17.6174 3.85119 18.1597 4.55199C18.702 5.25279 18.9962 6.11382 18.9962 6.99993C18.9962 7.88604 18.702 8.74707 18.1597 9.44787C17.6174 10.1487 16.8578 10.6496 16 10.8719" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Business developers",
    description: "Manage partnerships and opportunities",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.42 10.9219C21.599 10.8429 21.7509 10.7131 21.8569 10.5487C21.9629 10.3842 22.0183 10.1923 22.0163 9.99661C22.0143 9.80095 21.9549 9.61019 21.8455 9.44795C21.7362 9.28571 21.5816 9.15912 21.401 9.08387L12.83 5.17987C12.5694 5.06102 12.2864 4.99951 12 4.99951C11.7136 4.99951 11.4305 5.06102 11.17 5.17987L2.59998 9.07987C2.42195 9.15784 2.2705 9.286 2.16415 9.44868C2.0578 9.61136 2.00116 9.80151 2.00116 9.99587C2.00116 10.1902 2.0578 10.3804 2.16415 10.5431C2.2705 10.7057 2.42195 10.8339 2.59998 10.9119L11.17 14.8199C11.4305 14.9387 11.7136 15.0002 12 15.0002C12.2864 15.0002 12.5694 14.9387 12.83 14.8199L21.42 10.9219Z" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12.5V16C6 16.7956 6.63214 17.5587 7.75736 18.1213C8.88258 18.6839 10.4087 19 12 19C13.5913 19 15.1174 18.6839 16.2426 18.1213C17.3679 17.5587 18 16.7956 18 16V12.5" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Consultants",
    description: "Keep context on all your client contacts",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 9.50004C2.00002 8.38724 2.33759 7.30062 2.96813 6.3837C3.59867 5.46678 4.49252 4.7627 5.53161 4.36444C6.5707 3.96618 7.70616 3.89248 8.78801 4.15308C9.86987 4.41368 10.8472 4.99632 11.591 5.82404C11.6434 5.88005 11.7067 5.92471 11.7771 5.95524C11.8474 5.98577 11.9233 6.00152 12 6.00152C12.0767 6.00152 12.1526 5.98577 12.2229 5.95524C12.2933 5.92471 12.3566 5.88005 12.409 5.82404C13.1504 4.99094 14.128 4.40341 15.2116 4.13964C16.2952 3.87588 17.4335 3.94839 18.4749 4.34752C19.5163 4.74666 20.4114 5.45349 21.0411 6.37394C21.6708 7.29439 22.0053 8.3848 22 9.50004C22 11.79 20.5 13.5 19 15L13.508 20.313C13.3217 20.527 13.0919 20.699 12.834 20.8173C12.5762 20.9357 12.296 20.9979 12.0123 20.9997C11.7285 21.0015 11.4476 20.9429 11.1883 20.8278C10.9289 20.7127 10.697 20.5437 10.508 20.332L5 15C3.5 13.5 2 11.8 2 9.50004Z" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "HR professionals",
    description: "Organize talent pipeline and connections",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 18L22 12L16 6" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6L2 12L8 18" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Tech founders",
    description: "Build meaningful investor relationships",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 6C14.0414 6.07835 17.0139 5.0875 19.4 3.2C19.5486 3.08857 19.7252 3.02072 19.9102 3.00404C20.0952 2.98736 20.2811 3.02252 20.4472 3.10557C20.6133 3.18863 20.753 3.31629 20.8507 3.47427C20.9483 3.63225 21 3.81429 21 4V16C21 16.1857 20.9483 16.3678 20.8507 16.5257C20.753 16.6837 20.6133 16.8114 20.4472 16.8944C20.2811 16.9775 20.0952 17.0126 19.9102 16.996C19.7252 16.9793 19.5486 16.9114 19.4 16.8C17.0139 14.9125 14.0414 13.9217 11 14H5C4.46957 14 3.96086 13.7893 3.58579 13.4142C3.21071 13.0391 3 12.5304 3 12V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11Z" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6V14" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Marketers",
    description: "Track industry contacts and collaborations",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 16L19 8L22 16C21.13 16.65 20.08 17 19 17C17.92 17 16.87 16.65 16 16Z" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 16L5 8L8 16C7.13 16.65 6.08 17 5 17C3.92 17 2.87 16.65 2 16Z" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 21H17" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3V21" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 7H5C7 7 10 6 12 5C14 6 17 7 19 7H21" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Lawyers",
    description: "Maintain client and colleague notes",
  },
];

export default function UseCases() {
  return (
    <section className="py-24 px-8 bg-gradient-to-b from-transparent to-[rgba(245,245,245,0.3)]">
      <div className="max-w-[1136px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair font-semibold text-5xl text-azure mb-4">
            Voor elke professional die relaties waardeert
          </h2>
          <p className="text-xl text-grey max-w-[672px] mx-auto">
            Rolodink helpt professionals in verschillende sectoren om hun netwerk effectiever te beheren.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-white border border-azure/10 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                {useCase.icon}
              </div>
              <h3 className="font-semibold text-azure mb-2">{useCase.title}</h3>
              <p className="text-sm text-grey">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
