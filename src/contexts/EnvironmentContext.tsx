import { createContext, useContext, useState, ReactNode } from "react";

type Environment = "test" | "live";

interface EnvironmentContextType {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  isTestMode: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType>({
  environment: "test",
  setEnvironment: () => {},
  isTestMode: true,
});

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = useState<Environment>("test");

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        isTestMode: environment === "test",
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
