import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";
import styles from './styles.css';

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);
  const parentRef = useRef(null);

  const addMoveable = async () => {
    const COLORS = ["red", "blue", "yellow", "green", "purple"];

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/photos");
      const data = await response.json();
      const imageUrl = data[Math.floor(Math.random() * data.length)].url;

      setMoveableComponents((prevComponents) => [
        ...prevComponents,
        {
          id: Math.floor(Math.random() * Date.now()),
          top: 0,
          left: 0,
          width: 100,
          height: 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          imageUrl: imageUrl,
          updateEnd: true,
          parentRef: parentRef
        },
      ]);
    } catch (error) {
      console.log("Error fetching image:", error);
    }
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    const updatedMoveables = moveableComponents.map((moveable) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  const handleResizeStart = (id, e) => {
    setSelected(id);
  };

  const handleDelete = (id) => {
    const updatedMoveables = moveableComponents.filter(
      (moveable) => moveable.id !== id
    );
    setMoveableComponents(updatedMoveables);
  };

  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <button onClick={addMoveable}>Add Moveable</button>
      <div
        id="parent"
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
        ref={parentRef}
      >
        {moveableComponents.map((item) => (
          <Component
            {...item}
            key={item.id}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            handleDelete={handleDelete}
            setSelected={setSelected}
            isSelected={selected === item.id}
            parentRef={parentRef}
          />
        ))}
      </div>
    </main>
  );
};

export default App;

const Component = ({
  updateMoveable,
  handleResizeStart,
  handleDelete,
  top,
  left,
  width,
  height,
  color,
  imageUrl,
  id,
  setSelected,
  isSelected = false,
  updateEnd,
  parentRef,
}) => {
  const ref = useRef();
  const imageRef = useRef();
  const [x, setX] = useState(left);
  const [y, setY] = useState(top);

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    color,
    id,
  });

  const onResize = async (e) => {
    const parentBounds = parentRef.current.getBoundingClientRect();
    const newWidth = e.width;
    const newHeight = e.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      color,
    });


    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${e.width}px`;
    ref.current.style.height = `${e.height}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = async (e) => {
    const parentBounds = parentRef.current?.getBoundingClientRect(); // Move inside the function

    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    const absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    updateMoveable(
      id,
      {
        top: absoluteTop,
        left: absoluteLeft,
        width: newWidth,
        height: newHeight,
        color,
      },
      true
    );
  };


  const onDragEnd = () => {
    updateMoveable(id, {
      top: y,
      left: x,
      width,
      height,
      color,
    });
  };

  const onDrag = (e) => {
    const parentBounds = parentRef.current?.getBoundingClientRect(); // Move inside the function

    let newX = e.clientX;
    let newY = e.clientY;

    if (x < parentBounds.left) {
      newX = parentBounds.left;
    } else if (x + width > parentBounds.right) {
      newX = parentBounds.right - width;
    }

    if (y < parentBounds.top) {
      newY = parentBounds.top;
    } else if (y + height > parentBounds.bottom) {
      newY = parentBounds.bottom - height;
    }

    // Update the position of the component
    setX(newX);
    setY(newY);
  };

  useEffect(() => {
    const handleWindowResize = () => {
      const parentBounds = parentRef.current?.getBoundingClientRect();
      const imageWidth = parentBounds?.width || 0;
      const imageHeight = parentBounds?.height || 0;

      // Actualizar el tamaño de la imagen
      imageRef.current.style.width = `${imageWidth}px`;
      imageRef.current.style.height = `${imageHeight}px`;
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: y,
          left: x,
          width: width,
          height: height,
          background: color,
        }}
        onClick={() => setSelected(id)}
        draggable="true"
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Component Image"
        />

        <button
          onClick={() => handleDelete(id)}
          style={{ position: "absolute", top: 0, right: 0 }}
        >
          X
        </button>
      </div>

      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={onDrag}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
      />
    </>
  );
};