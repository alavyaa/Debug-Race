// import React from "react";

// import player1 from "../assets/player1.png";
// import player2 from "../assets/player2.png";
// import player3 from "../assets/player3.png";
// import player4 from "../assets/player4.png";

// interface AvatarProps {
//   userId: string;
//   username: string;
//   lobbyPosition?: number;
//   size?: "small" | "medium" | "large";
// }

// const AVATARS = [
//   player1,
//   player2,
//   player3,
//   player4,
// ];

// export const F1Avatar: React.FC<AvatarProps> = ({
//   username,
//   lobbyPosition = 0,
//   size = "medium",
// }) => {

//   const avatarSrc = AVATARS[lobbyPosition % 4];

//   const sizeConfig = {
//     small: 70,
//     medium: 110,
//     large: 160,
//   };

//   return (
//     <div
//       style={{
//         textAlign: "center",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         gap: "6px",
//       }}
//     >
//       <img
//         src={avatarSrc}
//         alt={`${username} avatar`}
//         style={{
//           width: sizeConfig[size],
//           height: sizeConfig[size] * 1.4,
//           objectFit: "contain",
//           filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))",
//         }}
//       />

//       <span
//         style={{
//           fontSize: "12px",
//           fontWeight: "bold",
//           color: "#FFD700",
//         }}
//       >
//         {username}
//       </span>
//     </div>
//   );
// };
