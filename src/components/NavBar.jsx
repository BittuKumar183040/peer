import React from 'react';
import ThemeSwithButton from './ThemeSwithButton';

const NavBar = () => {
  return (
    <div className=" dark:text-white flex justify-between gap-2 p-2 absolute w-full items-center">
      <div className="flex items-center gap-2 cursor-pointer">
        <img src="./logo.svg" />
        <p className=" font-bold text-blue-700">
          Nav
          <span className=" text-yellow-400">Logo</span>
        </p>
      </div>
      <li className="flex gap-4 pr-3 w-full justify-end">
        <p className=" cursor-pointer">Projects</p>
        <p className=" cursor-pointer">About Me</p>
        <p className=" cursor-pointer">Contact Us</p>
      </li>
      <ThemeSwithButton />
    </div>
  );
};

export default NavBar;
