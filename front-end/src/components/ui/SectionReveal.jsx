import { motion } from "framer-motion";

const SectionReveal = ({ children, className = "", delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
            style={{ willChange: "opacity, transform" }} // Optimize performance
        >
            {children}
        </motion.div>
    );
};

export default SectionReveal;
