import { useOutlet } from "react-router";

export default function PageTransition() {
  const outlet = useOutlet();
  
  return (
    <div 
      className="relative w-full"
      style={{ 
        backgroundColor: "white",
        minHeight: "100vh"
      }}
    >
      {outlet}
    </div>
  );
}
