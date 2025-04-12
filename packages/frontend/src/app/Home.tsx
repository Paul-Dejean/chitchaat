import { createRoom } from "@/services/rooms";
import { useNavigate } from "react-router";

const Home = () => {
  const navigate = useNavigate();

  const createMeeting =async  () => {

      const { id: roomId } = await createRoom();
      console.log({ redirect: `/rooms/?roomId=${roomId}` });
      navigate(`/rooms?roomId=${roomId}`);

  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <header className="px-6 py-4 flex justify-between items-center">
        <div className="logo">
          <h1 className="text-2xl font-heading font-bold text-primary">ChitChaat</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 py-8">
        <div className="max-w-3xl px-4 py-8">
          <h1 className="text-5xl md:text-6xl font-heading font-extrabold mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            Instant Video Meetings
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-inverted">
            Simple, Secure, and Free
          </h2>

          <p className="text-xl leading-relaxed text-muted mb-10 max-w-2xl mx-auto">
            Connect with anyone, anywhere through high-quality video meetings without the hassle of signups or downloads.
          </p>

          <button
            className="bg-primary hover:bg-primary-hover text-inverted text-xl font-semibold py-4 px-8 rounded-full
              shadow hover:shadow-lg transform transition duration-normal hover:-translate-y-0.5"
            onClick={createMeeting}
          >
            Start a Meeting Now
          </button>

          <div className="flex flex-col items-center md:flex-row justify-center gap-8 mt-12">
            <div className="flex items-center gap-2 text-md text-muted">
              <span className="text-2xl">🔒</span>
              <span>Secure Connections</span>
            </div>
            <div className="flex items-center gap-2 text-md text-muted">
              <span className="text-2xl">⚡</span>
              <span>Instant Setup</span>
            </div>
            <div className="flex items-center gap-2 text-md text-muted">
              <span className="text-2xl">👥</span>
              <span>Multiple Participants</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-muted text-sm border-t border-border">
        <p>&copy; {new Date().getFullYear()} ChitChaat - Connect Instantly</p>
      </footer>
    </div>
  );
};

export default Home;
