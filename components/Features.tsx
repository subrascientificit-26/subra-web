// import {
//   FlaskConical,
//   ShieldCheck,
//   Truck,
//   Headphones,
// } from 'lucide-react';

// const features = [
//   {
//     icon: FlaskConical,
//     count: '5000+',
//     title: 'Products',
//     description: 'Wide range of quality products',
//   },
//   {
//     icon: ShieldCheck,
//     count: '100%',
//     title: 'Quality Assured',
//     description: 'Premium quality products from trusted brands',
//   },
//   {
//     icon: Truck,
//     count: '',
//     title: 'Global Delivery',
//     description: 'On-time delivery across the globe',
//   },
//   {
//     icon: Headphones,
//     count: '',
//     title: 'Dedicated Support',
//     description: 'Expert support for all your requirements',
//   },
// ];

// export default function Features() {
//   return (
//     <section className="bg-[#020817] py-3 px-4">
//       <div className="max-w-7xl mx-auto">

//         {/* Outer Border Only */}
//         <div className="border border-gray-700 rounded-lg">

//           {/* Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-4">

//             {features.map((feature, index) => {
//               const Icon = feature.icon;

//               return (
//                 <div
//                   key={index}
//                   className="flex items-center gap-4 px-3 py-3"
//                 >
//                   {/* Icon */}
//                   <div className="flex-shrink-0">
//                     <div className="w-16 h-16 rounded-full border border-blue-700 flex items-center justify-center">
//                       <Icon
//                         size={28}
//                         className="text-blue-500"
//                         strokeWidth={1.8}
//                       />
//                     </div>
//                   </div>

//                   {/* Content */}
//                   <div>
//                     {feature.count && (
//                       <h2 className="text-lg font-bold text-white leading-none mb-1">
//                         {feature.count}
//                       </h2>
//                     )}

//                     <h3 className="text-lg font-semibold text-white mb-1">
//                       {feature.title}
//                     </h3>

//                     <p className="text-sm text-gray-400 leading-5">
//                       {feature.description}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}

//           </div>
//         </div>

//       </div>
//     </section>
//   );
// }