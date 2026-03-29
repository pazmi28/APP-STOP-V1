import { CATEGORIAS } from "../../utils/letras";

const CategoriasGrid = ({
  letra,
  respuestas,
  onRespuestaChange,
  onFocus,
  onBlur,
  onKeyDown,
  disabled,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "var(--spacing-md)",
        margin: "var(--spacing-lg) 0",
      }}
    >
      {CATEGORIAS.map((cat) => (
        <div
          key={cat.id}
          style={{
            background: "var(--gray-50)",
            border: "1px solid var(--gray-200)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-md)",
            transition: "all var(--transition)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              marginBottom: "var(--spacing-sm)",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>{cat.icono}</span>
            <span
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                color: "var(--gray-500)",
                fontWeight: 600,
              }}
            >
              {cat.nombre}
            </span>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="text"
              className="form-input"
              value={respuestas[cat.id] || ""}
              onChange={(e) => onRespuestaChange(cat.id, e.target.value)}
              onFocus={() => onFocus && onFocus(cat.id)}
              onBlur={(e) => onBlur && onBlur(cat.id, e.target.value)}
              onKeyDown={(e) =>
                onKeyDown && onKeyDown(e, cat.id, e.target.value)
              }
              placeholder={letra ? `${letra}...` : cat.placeholder}
              disabled={disabled}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              style={{
                paddingLeft: letra ? "2rem" : "var(--spacing-md)",
                background: disabled ? "var(--gray-100)" : "white",
              }}
            />
            {letra && (
              <span
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontWeight: "bold",
                  color: "var(--primary)",
                  fontSize: "1rem",
                  pointerEvents: "none",
                }}
              >
                {letra}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoriasGrid;
