import React from "react";
import { motion } from "framer-motion";
import { useCountAnimation } from "@/hooks/useCountAnimation";
import { Link } from "react-router-dom";

const AnimatedNumber = ({ value }) => {
  const displayValue = useCountAnimation(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="relative"
    >
      <motion.span
        key={displayValue}
        className="absolute"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {displayValue.toLocaleString()}
      </motion.span>
    </motion.div>
  );
};

const StateCard = ({ state }) => {
  return (
    <Link to={state.link} className="text-sm text-muted-foreground">
      <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-primary/5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3, type: "spring" }}
          className="p-3 rounded-full bg-primary/10"
        >
          {state.icon}
        </motion.div>
        <div>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm font-medium text-muted-foreground"
          >
            {state.label}
          </motion.p>
          <h3 className="text-2xl font-bold tracking-tight ml-1">
            <AnimatedNumber value={state.value} />
          </h3>
        </div>{" "}
      </div>{" "}
    </Link>
  );
};

export default StateCard;
